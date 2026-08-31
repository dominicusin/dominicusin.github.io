# ENS Setup Guide for dominicus.in

## 1. Register ENS Domain

1. Go to [app.ens.domains](https://app.ens.domains)
2. Search for `dominicusin.eth`
3. Register (≈$5/year for 5+ char domains)

## 2. Configure ENS Records

### Contenthash (IPFS)
```
Name: dominicusin.eth
Key: Contenthash
Value: ipfs://Qm... (your IPFS CID)
```

### Text Records
```
Key: avatar, Value: ipfs://Qm.../images/avatar.svg
Key: description, Value: Decentralized engineering knowledge
Key: url, Value: https://dominicusin.github.io
Key: com.github, Value: dominicusin
Key: com.twitter, Value: dominicusin
```

### Address Records
```
ETH: 0x... (your wallet)
BTC: bc1...
```

## 3. IPNS for Mutable References

IPNS provides a stable pointer that can be updated:

```bash
# Generate IPNS key
ipfs key gen dominicusin

# Publish to IPNS
ipfs name publish /ipfs/QmCurrentCID
# → k51qzi5uqu5dj...

# ENS Contenthash → ipns://k51qzi5uqu5dj...
```

## 4. Gateway Fallback

Users without IPFS support can access via:
- Cloudflare: https://cloudflare-ipfs.com/ipfs/Qm...
- Pinata: https://gateway.pinata.cloud/ipfs/Qm...
- IPFS.io: https://ipfs.io/ipfs/Qm...
- dweb.link: https://Qm....dweb.link

## 5. DNSLink (Alternative to ENS)

If ENS is too complex initially, use DNSLink:

```
# DNS TXL record
Name: _dnslink.dominicusin.github.io
Type: TXT
Value: dnslink=/ipfs/Qm...
```

## 6. Automation

The `deploy-ipfs.yml` workflow:
1. Builds Hugo site
2. Uploads to Pinata (IPFS)
3. Outputs CID

To update ENS:
- Option A: Manually update Contenthash in ENS app
- Option B: Use `scripts/update-ens.cjs` (requires private key)
- Option C: Use IPNS + automate with GitHub Actions

## 7. Security

- Store ENS private key in GitHub Secrets (`ENS_PRIVATE_KEY`)
- Use hardware wallet for mainnet
- Test on Goerli/Sepolia first
