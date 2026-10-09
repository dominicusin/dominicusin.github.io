# Как внести изменения

В репозитории публикуется сайт на Hugo и хранится отдельный инженерный архив. Карту проекта и команды см. в [README](../README.md), устройство сборки — в [описании архитектуры](ARCHITECTURE.md).

## Публикация материалов

1. Статьи размещаются в `content/blog/`, страницы — в подходящем разделе `content/`.
2. Новые статьи должны соответствовать `schema/post-metadata.schema.json`. При смене URL добавляйте Hugo `aliases`, чтобы сохранить старые ссылки.
3. Проверка метаданных статьи: `node scripts/validate-frontmatter.cjs content/blog/<файл>.md`.
4. Локальный просмотр и публикация описаны в [руководстве по публикации](PUBLISHING.md).

Для локального просмотра нужны Node.js 24 и Hugo Extended 0.164.0:

```sh
git submodule update --init themes/blowfish
npm ci --prefix scripts
node scripts/sync-github.cjs
node scripts/build-knowledge-graph.cjs
node scripts/build-ontology-feed.cjs
node scripts/build-crosslinks.cjs
node scripts/build-awesome.cjs
hugo server -D
```

## Инженерный архив

Каталоги `src/` и `contracts/dao/` сохранены как исследовательские проекты и не попадают на сайт. Для работы с ними установите зависимости корневого `package.json`:

```sh
npm ci
npm run lint
npm test
npx hardhat test
```

## Pull request

- Создавайте PR в `main` и коротко описывайте результат.
- Обязательная проверка **Quality CI** собирает Hugo-сайт и проверяет метаданные, lint и внутренние ссылки.
- Для изменений инженерного архива отдельно запускаются R&D-проверки; Playwright и сканеры безопасности также идут отдельными workflow.
- Не добавляйте в коммиты сгенерированную сборку, `node_modules` и кэш Hugo.
