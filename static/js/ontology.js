(function () {
  'use strict';
  var root = document.getElementById('ontology-root');
  if (!root) return;
  function node(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  fetch('/data/ontology.json')
    .then(function (response) { if (!response.ok) throw new Error('data unavailable'); return response.json(); })
    .then(function (data) {
      root.innerHTML = '';
      var totalTags = (data.categories || []).reduce(function (sum, category) { return sum + category.tags.length; }, 0);
      var summary = node('p', 'text-sm text-neutral-500', (data.categories || []).length + ' категорий · ' + totalTags + ' тем · ' + (data.repositories || []).length + ' репозиториев · ' + (data.gists || []).length + ' гистов');
      root.appendChild(summary);
      (data.categories || []).forEach(function (category) {
        var section = node('section', 'rounded-xl border border-neutral-200 p-5 dark:border-neutral-700');
        var title = node('h2', 'mt-0 text-xl font-bold');
        var link = node('a', 'hover:text-primary-600', category.title);
        link.href = '/categories/' + encodeURIComponent(category.slug) + '/';
        title.appendChild(link);
        section.appendChild(title);
        if (!category.tags.length) section.appendChild(node('p', 'text-sm text-neutral-500', 'Пока нет связанных тегов.'));
        var tags = node('div', 'flex flex-wrap gap-2');
        category.tags.forEach(function (tag) {
          var chip = node('a', 'rounded-full bg-neutral-100 px-3 py-1 text-sm dark:bg-neutral-800', tag.slug + ' · ' + tag.postCount);
          chip.href = '/tags/' + encodeURIComponent(tag.slug) + '/';
          tags.appendChild(chip);
        });
        section.appendChild(tags);
        root.appendChild(section);
      });
      if (!data.categories || !data.categories.length) root.appendChild(node('p', 'text-neutral-500', 'Онтология пока не содержит категорий.'));
      if (data.repositoryTopics && data.repositoryTopics.length) {
        var topicsSection = node('section', 'rounded-xl border border-neutral-200 p-5 dark:border-neutral-700');
        topicsSection.appendChild(node('h2', 'mt-0 text-xl font-bold', 'Темы репозиториев'));
        var topics = node('div', 'flex flex-wrap gap-2');
        data.repositoryTopics.slice(0, 30).forEach(function (topic) {
          var chip = node('a', 'rounded-full border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-600', topic.slug + ' · ' + topic.repoCount);
          chip.href = 'https://github.com/topics/' + encodeURIComponent(topic.slug);
          chip.target = '_blank'; chip.rel = 'noopener noreferrer';
          topics.appendChild(chip);
        });
        topicsSection.appendChild(topics);
        root.appendChild(topicsSection);
      }
      [['repositories', 'Репозитории', 12], ['gists', 'Gists', 12]].forEach(function (config) {
        var items = data[config[0]] || [];
        if (!items.length) return;
        var section = node('section', 'rounded-xl border border-neutral-200 p-5 dark:border-neutral-700');
        section.appendChild(node('h2', 'mt-0 text-xl font-bold', config[1]));
        var list = node('ul', 'grid gap-2 sm:grid-cols-2');
        items.slice(0, config[2]).forEach(function (item) {
          var li = node('li');
          var link = node('a', 'font-medium hover:text-primary-600', config[0] === 'repositories' ? item.owner + '/' + item.name : item.description || item.id.replace(/^gist:/, 'Gist '));
          link.href = item.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
          li.appendChild(link);
          if (config[0] === 'gists') li.appendChild(node('span', 'ms-2 text-xs text-neutral-500', item.fileCount + ' файлов'));
          list.appendChild(li);
        });
        section.appendChild(list);
        root.appendChild(section);
      });
    })
    .catch(function () { root.innerHTML = '<p class="text-neutral-500">Не удалось загрузить тематический указатель. Категории доступны на странице <a href="/categories/">категорий</a>, теги — в <a href="/tags/">списке тегов</a>.</p>'; });
}());
