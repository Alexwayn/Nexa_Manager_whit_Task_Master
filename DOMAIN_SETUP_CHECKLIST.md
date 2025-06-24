# Domain Setup Checklist - Hostinger to AWS Amplify

## Steps to Complete:

- [ ] 1. Add domain in AWS Amplify Console
- [ ] 2. Copy DNS records provided by AWS
- [ ] 3. Log into Hostinger hPanel
- [ ] 4. Navigate to DNS Zone Editor
- [ ] 5. Add CNAME record for www subdomain
- [ ] 6. Add A records for root domain (or set up redirect)
- [ ] 7. Save DNS changes in Hostinger
- [ ] 8. Wait for DNS propagation (15 min - 48 hours)
- [ ] 9. Check AWS Amplify for verification status
- [ ] 10. Test both www and non-www versions

## DNS Records Format:

### CNAME Record (for www):
- Type: CNAME
- Name: www
- Value: [your-cloudfront-domain].cloudfront.net
- TTL: 14400

### A Records (for root domain):
- Type: A
- Name: @ (or leave blank)
- Value: [IP addresses from AWS]
- TTL: 14400

## Troubleshooting:

- If Hostinger doesn't support certain record types, consider using Cloudflare
- Make sure to remove any existing A/CNAME records that conflict
- Use DNS lookup tools to verify propagation: https://dnschecker.org

## Alternative: Cloudflare Setup

1. Create free Cloudflare account
2. Add your domain
3. Update nameservers in Hostinger to Cloudflare's
4. Add AWS Amplify records in Cloudflare
5. Enable "Proxy" for better performance 