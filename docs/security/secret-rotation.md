# Secret Rotation Procedure

1. Create new secret version in AWS Secrets Manager or Vault.
2. Deploy services with dual-read support where applicable.
3. Re-encrypt data encryption keys when rotating KMS aliases.
4. Revoke old token-signing keys after access-token expiry window.
5. Confirm no old secret version is used by running pods.

