/**
 * AI Link Repair Agent
 * Автоматическое обнаружение и исправление битых ссылок с генерацией PR
 */

import { Octokit } from '@octokit/rest';
import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';

export class LinkRepairAgent {
  constructor(options = {}) {
    this.octokit = new Octokit({ auth: options.githubToken });
    this.owner = options.owner;
    this.repo = options.repo;
    this.baseBranch = options.baseBranch || 'main';
    this.dryRun = options.dryRun || false;
    
    // Кэш проверенных ссылок
    this.linkCache = new Map();
    this.brokenLinks = [];
    this.suggestedFixes = [];
  }

  /**
   * Сканирование проекта на наличие битых ссылок
   */
  async scanForBrokenLinks() {
    console.log('🔍 Starting link scan...');
    
    // Получаем все markdown и HTML файлы
    const files = await glob('**/*.{md,html,njk,liquid}', {
      ignore: ['node_modules/**', '_site/**', '.git/**']
    });

    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)|href=["']([^"']+)["']/g;
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      let match;
      
      while ((match = linkPattern.exec(content)) !== null) {
        const link = match[2] || match[3];
        if (!link || link.startsWith('#') || link.startsWith('mailto:') || link.startsWith('tel:')) {
          continue; // Пропускаем якоря и контакты
        }

        const lineNumber = content.substring(0, match.index).split('\n').length;
        
        const isValid = await this.checkLink(link, file);
        if (!isValid) {
          this.brokenLinks.push({
            file,
            line: lineNumber,
            link,
            context: match[1] || 'N/A',
            type: this.getLinkType(link)
          });
        }
      }
    }

    console.log(`❌ Found ${this.brokenLinks.length} broken links`);
    return this.brokenLinks;
  }

  /**
   * Проверка доступности ссылки
   */
  async checkLink(url, sourceFile) {
    const cacheKey = `${url}:${sourceFile}`;
    if (this.linkCache.has(cacheKey)) {
      return this.linkCache.get(cacheKey);
    }

    // Внутренние ссылки
    if (url.startsWith('/') || !url.startsWith('http')) {
      const isValid = await this.checkInternalLink(url, sourceFile);
      this.linkCache.set(cacheKey, isValid);
      return isValid;
    }

    // Внешние ссылки - проверяем через HEAD запрос
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'LinkRepairBot/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      const isValid = response.ok || response.status === 301 || response.status === 302;
      
      this.linkCache.set(cacheKey, isValid);
      return isValid;
    } catch {} {
      this.linkCache.set(cacheKey, false);
      return false;
    }
  }

  /**
   * Проверка внутренней ссылки
   */
  async checkInternalLink(url, sourceFile) {
    let targetPath = url.split('#')[0]; // Убираем якорь
    
    // Относительные пути
    if (targetPath.startsWith('./') || targetPath.startsWith('../')) {
      targetPath = path.resolve(path.dirname(sourceFile), targetPath);
    } else if (targetPath.startsWith('/')) {
      targetPath = path.join(process.cwd(), targetPath.substring(1));
    } else {
      // Предполагаем, что это файл в той же директории
      targetPath = path.resolve(path.dirname(sourceFile), targetPath);
    }

    try {
      await fs.access(targetPath);
      return true;
    } catch {
      // Проверяем альтернативные расширения
      const extensions = ['.md', '.html', '.njk', '.liquid', ''];
      for (const ext of extensions) {
        try {
          await fs.access(targetPath + ext);
          return true;
        } catch {
          continue;
        }
      }
      return false;
    }
  }

  /**
   * Определение типа ссылки
   */
  getLinkType(url) {
    if (url.startsWith('/')) return 'internal-absolute';
    if (url.startsWith('http')) return 'external';
    if (url.startsWith('./') || url.startsWith('../')) return 'internal-relative';
    return 'internal-unknown';
  }

  /**
   * AI-генерация предложений по исправлению
   */
  async generateFixSuggestions() {
    console.log('🤖 Generating AI fix suggestions...');
    
    for (const brokenLink of this.brokenLinks) {
      const suggestions = await this.findSimilarFiles(brokenLink);
      
      if (suggestions.length > 0) {
        this.suggestedFixes.push({
          ...brokenLink,
          suggestions,
          confidence: this.calculateConfidence(brokenLink, suggestions[0])
        });
      }
    }

    console.log(`💡 Generated ${this.suggestedFixes.length} fix suggestions`);
    return this.suggestedFixes;
  }

  /**
   * Поиск похожих файлов для замены
   */
  async findSimilarFiles(brokenLink) {
    const fileName = path.basename(brokenLink.link).split('.')[0];
    
    // Ищем файлы с похожими именами
    const allFiles = await glob('**/*.{md,html,njk,liquid}', {
      ignore: ['node_modules/**', '_site/**', '.git/**']
    });

    const similar = allFiles
      .filter(file => {
        const baseName = path.basename(file).split('.')[0];
        return baseName.toLowerCase().includes(fileName.toLowerCase()) || 
               fileName.toLowerCase().includes(baseName.toLowerCase());
      })
      .map(file => ({
        path: file,
        similarity: this.calculateStringSimilarity(fileName, path.basename(file).split('.')[0])
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);

    return similar;
  }

  /**
   * Расчет схожести строк (Levenshtein distance based)
   */
  calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  calculateConfidence(brokenLink, suggestion) {
    let confidence = suggestion.similarity;
    
    // Увеличиваем уверенность если типы совпадают
    if (path.extname(brokenLink.link) === path.extname(suggestion.path)) {
      confidence += 0.1;
    }
    
    // Увеличиваем если директории совпадают
    if (path.dirname(brokenLink.link) === path.dirname(suggestion.path)) {
      confidence += 0.15;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Создание Pull Request с исправлениями
   */
  async createPullRequest() {
    if (this.suggestedFixes.length === 0) {
      console.log('No fixes to apply');
      return null;
    }

    const branchName = `fix/broken-links-${Date.now()}`;
    
    // Создаем новую ветку
    if (!this.dryRun) {
      const ref = await this.octokit.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${this.baseBranch}`
      });
      
      await this.octokit.git.createRef({
        owner: this.owner,
        repo: this.repo,
        ref: `refs/heads/${branchName}`,
        sha: ref.data.object.sha
      });
    }

    // Применяем исправления
    const commits = [];
    for (const fix of this.suggestedFixes) {
      if (fix.confidence < 0.6) continue; // Пропускаем низкую уверенность
      
      const commitInfo = await this.applyFix(fix, branchName);
      if (commitInfo) {
        commits.push(commitInfo);
      }
    }

    if (commits.length === 0) {
      console.log('No high-confidence fixes to apply');
      return null;
    }

    // Создаем PR
    if (!this.dryRun) {
      const pr = await this.octokit.pulls.create({
        owner: this.owner,
        repo: this.repo,
        title: `🔗 Auto-fix: ${commits.length} broken links`,
        body: this.generatePRBody(commits),
        head: branchName,
        base: this.baseBranch
      });

      console.log(`✅ PR created: ${pr.data.html_url}`);
      return pr.data;
    } else {
      console.log('🧪 Dry run mode - no PR created');
      console.log('Would create PR with:', commits);
      return { dryRun: true, commits };
    }
  }

  /**
   * Применение исправления к файлу
   */
  async applyFix(fix, branchName) {
    const filePath = fix.file;
    
    try {
      // Получаем текущее содержимое файла
      const { data: fileData } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        ref: branchName
      });

      const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
      const lines = content.split('\n');
      
      // Заменяем ссылку в строке
      const oldLine = lines[fix.line - 1];
      const newLine = oldLine.replace(
        fix.link,
        fix.suggestions[0].path.startsWith('/') 
          ? fix.suggestions[0].path 
          : './' + fix.suggestions[0].path
      );
      
      lines[fix.line - 1] = newLine;
      const newContent = lines.join('\n');

      // Коммитим изменения
      const { data: commit } = await this.octokit.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        message: `fix: replace broken link in ${filePath}\n\nReplaced ${fix.link} with ${fix.suggestions[0].path}\nConfidence: ${(fix.confidence * 100).toFixed(0)}%`,
        content: Buffer.from(newContent).toString('base64'),
        sha: fileData.sha,
        branch: branchName
      });

      return {
        file: filePath,
        oldLink: fix.link,
        newLink: fix.suggestions[0].path,
        confidence: fix.confidence,
        commitSha: commit.commit.sha
      };
    } catch {} {
      console.error(`Failed to apply fix for ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Генерация описания для PR
   */
  generatePRBody(commits) {
    let body = `## 🔗 Automated Link Repair\n\nThis PR was automatically generated by the Link Repair Agent.\n\n### Summary\n- **Total broken links found**: ${this.brokenLinks.length}\n- **Fixes applied**: ${commits.length}\n- **Average confidence**: ${(commits.reduce((acc, c) => acc + c.confidence, 0) / commits.length * 100).toFixed(1)}%\n\n### Changes\n\n| File | Old Link | New Link | Confidence |\n|------|----------|----------|------------|\n`;
    
    commits.forEach(commit => {
      body += `| ${commit.file} | \`${commit.oldLink}\` | \`${commit.newLink}\` | ${(commit.confidence * 100).toFixed(0)}% |\n`;
    });

    body += `\n---\n\n### How it works\n1. Scans all markdown and HTML files for broken links\n2. Uses AI to suggest similar existing files as replacements\n3. Creates individual commits for each high-confidence fix\n4. Opens a PR for human review\n\n> ⚠️ Please review changes before merging. Confidence scores are estimates.`;
    
    return body;
  }

  /**
   * Полный пайплайн: сканирование → предложения → PR
   */
  async run() {
    await this.scanForBrokenLinks();
    await this.generateFixSuggestions();
    return await this.createPullRequest();
  }
}

// CLI usage
if (process.argv[1]?.includes('link-repair-agent')) {
  const agent = new LinkRepairAgent({
    githubToken: process.env.GITHUB_TOKEN,
    owner: process.env.REPO_OWNER,
    repo: process.env.REPO_NAME,
    dryRun: process.argv.includes('--dry-run')
  });

  agent.run()
    .then(result => {
      console.log('✅ Link repair completed');
      if (result) {
        console.log('PR URL:', result.html_url || 'Dry run mode');
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Link repair failed:', error);
      process.exit(1);
    });
}

export default LinkRepairAgent;
