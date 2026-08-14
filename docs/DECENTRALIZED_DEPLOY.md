# Decentralized Deployment Guide

## Overview

This guide covers deployment to IPFS and automated notifications to Fediverse platforms (Mastodon, Pixelfed) using ActivityPub protocol.

## IPFS Deployment

### Prerequisites

1. **IPFS Account**: Sign up at [Pinata](https://pinata.cloud) or [Infura](https://infura.io)
2. **API Keys**: Generate API key and secret
3. **Gateway Access**: Configure custom gateway (optional)

### GitHub Actions Workflow

The workflow automatically deploys to IPFS on every push to `main`:

```yaml
# .github/workflows/deploy-ipfs.yml
name: Deploy to IPFS

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build site
        run: npm run build
      
      - name: Pin to IPFS via Pinata
        uses: aquiladev/ipfs-action@v0.2.1
        with:
          path: './_site'
          service: 'pinata'
          pinataKey: ${{ secrets.PINATA_API_KEY }}
          pinataSecret: ${{ secrets.PINATA_SECRET_KEY }}
          pinataName: 'blog-deployment-${{ github.sha }}'
      
      - name: Save CID
        run: |
          echo "${{ steps.ipfs.outputs.hash }}" > ipfs-cid.json
          cat ipfs-cid.json
      
      - name: Update DNSLink
        if: github.ref == 'refs/heads/main'
        run: |
          # Update DNS TXT record for _dnslink.yourdomain.com
          curl -X PUT \
            "https://api.cloudflare.com/client/v4/zones/${{ secrets.CF_ZONE_ID }}/dns_records" \
            -H "Authorization: Bearer ${{ secrets.CF_API_TOKEN }}" \
            -H "Content-Type: application/json" \
            --data '{
              "type": "TXT",
              "name": "_dnslink.yourdomain.com",
              "content": "dnslink=/ipfs/${{ steps.ipfs.outputs.hash }}"
            }'
      
      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: thollander/actions-comment-pull-request@v2
        with:
          message: |
            📦 IPFS Preview deployed!
            
            **CID**: `${{ steps.ipfs.outputs.hash }}`
            **Gateway**: https://gateway.pinata.cloud/ipfs/${{ steps.ipfs.outputs.hash }}
            
            View your preview at: https://yourdomain.ipfs.dweb.link/ipfs/${{ steps.ipfs.outputs.hash }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Configuration

#### Secrets Required

Add these to your GitHub repository settings (`Settings > Secrets and variables > Actions`):

| Secret | Description |
|--------|-------------|
| `PINATA_API_KEY` | Pinata API key |
| `PINATA_SECRET_KEY` | Pinata API secret |
| `CF_API_TOKEN` | Cloudflare API token (for DNS) |
| `CF_ZONE_ID` | Cloudflare zone ID |

#### Pinata Setup

1. Go to [Pinata Dashboard](https://app.pinata.cloud/)
2. Navigate to **API Keys**
3. Create new API key with:
   - **Permissions**: `pin`, `unpin`, `list`
   - **Max size**: Unlimited (or your limit)
4. Copy key and secret to GitHub secrets

#### DNSLink Configuration

DNSLink allows you to use a custom domain with IPFS:

```
# DNS TXT Record
_dnslink.yourdomain.com. IN TXT "dnslink=/ipfs/QmYourCIDHere"
```

For automatic updates, the workflow updates this record on each deployment.

### Accessing Your IPFS Site

Once deployed, your site is accessible via:

1. **Pinata Gateway**: `https://gateway.pinata.cloud/ipfs/{CID}`
2. **Public Gateways**: 
   - `https://ipfs.io/ipfs/{CID}`
   - `https://cloudflare-ipfs.com/ipfs/{CID}`
   - `https://dweb.link/ipfs/{CID}`
3. **Custom Domain**: If DNSLink configured, `https://yourdomain.com`

### IPFS Best Practices

1. **Asset Hashing**: Use content-hashed filenames for cache busting
2. **Relative Paths**: Ensure all paths are relative for IPFS compatibility
3. **Fallback URLs**: Provide HTTP fallbacks for large assets
4. **Pinning Strategy**: Pin important versions permanently

## Fediverse Auto-Posting

### Overview

Automatically post new blog entries to Mastodon, Pixelfed, and other ActivityPub-compatible platforms.

### How It Works

1. New post pushed to `main` branch
2. GitHub Actions generates ActivityPub object (JSON-LD)
3. POST request sent to server's Inbox endpoint
4. Post appears on your profile

### GitHub Actions Workflow

```yaml
# .github/workflows/fediverse-notify.yml
name: Fediverse Notify

on:
  push:
    branches: [main]
    paths: ['_posts/**']

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Get latest post info
        id: post
        run: |
          LATEST_POST=$(ls -t _posts/*.markdown | head -1)
          echo "title=$(grep '^title:' $LATEST_POST | cut -d':' -f2-)" >> $GITHUB_OUTPUT
          echo "url=$(grep '^permalink:' $LATEST_POST | cut -d':' -f2- | tr -d ' ')" >> $GITHUB_OUTPUT
          echo "excerpt=$(grep '^excerpt:' $LATEST_POST | cut -d':' -f2-)" >> $GITHUB_OUTPUT
      
      - name: Generate ActivityPub Object
        id: ap_object
        run: |
          cat > activitypub.json << EOF
          {
            "@context": "https://www.w3.org/ns/activitystreams",
            "type": "Create",
            "actor": "${{ secrets.ACTIVITYPUB_ACTOR }}",
            "object": {
              "type": "Article",
              "name": "${{ steps.post.outputs.title }}",
              "content": "${{ steps.post.outputs.excerpt }}",
              "url": "https://yourdomain.com${{ steps.post.outputs.url }}",
              "image": "https://yourdomain.com/assets/og-image.jpg",
              "published": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
              "attributedTo": "${{ secrets.ACTIVITYPUB_ACTOR }}",
              "to": ["https://www.w3.org/ns/activitystreams#Public"]
            }
          }
          EOF
      
      - name: Send to Mastodon Inbox
        run: |
          curl -X POST \
            "${{ secrets.MASTODON_INBOX_URL }}" \
            -H "Content-Type: application/activity+json" \
            -H "Signature: ${{ secrets.ACTIVITYPUB_SIGNATURE }}" \
            -d @activitypub.json
      
      - name: Cross-post to Twitter (optional)
        uses: ethomson/send-tweet-action@v1
        with:
          status: "📝 New post: ${{ steps.post.outputs.title }}\n\n${{ steps.post.outputs.excerpt }}\n\nhttps://yourdomain.com${{ steps.post.outputs.url }}"
          consumer-key: ${{ secrets.TWITTER_CONSUMER_KEY }}
          consumer-secret: ${{ secrets.TWITTER_CONSUMER_SECRET }}
          access-token: ${{ secrets.TWITTER_ACCESS_TOKEN }}
          access-token-secret: ${{ secrets.TWITTER_ACCESS_TOKEN_SECRET }}
```

### ActivityPub Configuration

#### Required Secrets

| Secret | Description | Example |
|--------|-------------|---------|
| `ACTIVITYPUB_ACTOR` | Your Actor IRI | `https://mastodon.social/users/yourname` |
| `MASTODON_INBOX_URL` | Server inbox URL | `https://mastodon.social/users/yourname/inbox` |
| `ACTIVITYPUB_SIGNATURE` | HTTP Signature key | Generated private key |

#### Getting Your Actor Info

1. **Mastodon**:
   - Actor URL: `https://{instance}/users/{username}`
   - Inbox: `https://{instance}/users/{username}/inbox`

2. **Pixelfed**:
   - Actor URL: `https://{instance}/p/{username}`
   - Inbox: `https://{instance}/users/{username}/inbox`

#### HTTP Signatures

ActivityPub requires signed requests. Generate a key pair:

```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -pubout -out public.pem

# Register public key with your Mastodon instance
```

Store the private key as `ACTIVITYPUB_SIGNATURE` in GitHub secrets.

### ActivityPub Object Format

Example Article object:

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://schema.org/"
  ],
  "type": "Article",
  "id": "https://yourdomain.com/posts/my-post",
  "name": "My Blog Post Title",
  "content": "<p>Post excerpt or summary...</p>",
  "url": "https://yourdomain.com/posts/my-post",
  "image": "https://yourdomain.com/assets/og-image.jpg",
  "published": "2025-01-14T10:00:00Z",
  "attributedTo": "https://mastodon.social/users/yourname",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://mastodon.social/users/yourname/followers"],
  "tag": [
    {
      "type": "Hashtag",
      "href": "https://yourdomain.com/tags/javascript",
      "name": "#javascript"
    }
  ]
}
```

### Testing

#### Test IPFS Deployment

```bash
# Build locally
npm run build

# Test with local IPFS node
ipfs add -r ./_site

# Verify gateway access
curl https://gateway.pinata.cloud/ipfs/{YOUR_CID}
```

#### Test Fediverse Posting

```bash
# Test ActivityPub object
curl -X POST \
  https://mastodon.social/users/yourname/inbox \
  -H "Content-Type: application/activity+json" \
  -H "Signature: test-signature" \
  -d @test-object.json
```

### Troubleshooting

#### IPFS Issues

**Problem**: CID not resolving  
**Solution**: Wait 5-10 minutes for propagation, try different gateway

**Problem**: Assets not loading  
**Solution**: Check paths are relative, verify asset hashing

#### Fediverse Issues

**Problem**: 401 Unauthorized  
**Solution**: Verify HTTP signature, check key format

**Problem**: Post not appearing  
**Solution**: Check server federation status, verify ActivityPub object validity

**Problem**: Rate limiting  
**Solution**: Add delay between posts, respect server limits

## Security Considerations

### API Key Security

- Never commit API keys to repository
- Use GitHub secrets for all sensitive data
- Rotate keys periodically
- Limit key permissions (read-only where possible)

### Signature Validation

- Validate incoming ActivityPub requests
- Use strong cryptographic signatures
- Implement replay attack prevention

### Rate Limiting

- Respect Fediverse server rate limits
- Implement exponential backoff
- Monitor for failed deliveries

## Resources

- [IPFS Documentation](https://docs.ipfs.tech/)
- [Pinata API Docs](https://docs.pinata.cloud/)
- [ActivityPub Specification](https://www.w3.org/TR/activitypub/)
- [Mastodon API](https://docs.joinmastodon.org/api/)
- [HTTP Signatures](https://tools.ietf.org/html/draft-cavage-http-signatures)

---

**Last Updated**: 2025-01-14  
**Version**: 3.0.0-beta
