---
title: "IPFS Deploy"
description: "Децентрализованный хостинг на IPFS. Полный выход из GitHub Pages."
layout: "ipfs-deploy"
---

Децентрализованный хостинг на IPFS с автоматическим обновлением через IPNS и ENS.

## Архитектура

```
Пользователь → ENS (dominicusin.eth) → IPNS → IPFS CID → Контент
```

## Компоненты

| Компонент | Статус | Описание |
|-----------|--------|----------|
| IPNS | ✅ | Mutable pointer для обновлений |
| ENS | ✅ | dominicusin.eth → IPNS |
| IPFS Pinning | ✅ | Pinata + Filebase |
| Auto Deploy | ✅ | GitHub Actions → IPFS |
| DNSLink | ✅ | Fallback для обычных браузеров |

## Как это работает

1. **Build** → Hugo генерирует статические файлы
2. **Pack** → tar.gz архив создаётся
3. **Pin** → Pinata пиннит на IPFS
4. **Update IPNS** → IPNS указывает на новый CID
5. **Update ENS** → ENS указывает на IPNS

## Fallback

Для пользователей без IPFS:
- **DNSLink** → Cloudflare IPFS gateway
- **GitHub Pages** → Резервный хостинг
