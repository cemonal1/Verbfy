# Database Migrations Guide

## Overview

Verbfy uses `migrate-mongo` for database schema migrations. This ensures consistent and versioned database changes across all environments.

## Configuration

Migration configuration is defined in `/backend/migrate-mongo-config.js`:

- **MongoDB URL**: Reads from `MONGO_URI` environment variable
- **Database Name**: `verbfy`
- **Migrations Directory**: `/backend/migrations`
- **Changelog Collection**: `changelog`

## Commands

### Create a new migration

```bash
cd backend
npm run migrate:create <migration-name>
```

Example:
```bash
npm run migrate:create add-user-preferences
```

### Run pending migrations

```bash
npm run migrate
```

### Rollback last migration

```bash
npm run migrate:down
```

### Check migration status

```bash
npm run migrate:status
```

## Migration File Structure

Each migration file must export two functions:

```javascript
module.exports = {
  async up(db, client) {
    // Forward migration logic
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
  },

  async down(db, client) {
    // Rollback logic
    await db.collection('users').dropIndex('email_1');
  }
};
```

## Best Practices

### 1. Always Test Migrations

Test migrations in development and staging before production:

```bash
# Test up migration
npm run migrate

# Test down migration
npm run migrate:down

# Verify database state
npm run migrate:status
```

### 2. Write Reversible Migrations

Always implement the `down` function to allow rollbacks:

```javascript
async up(db) {
  await db.collection('users').updateMany({}, { $set: { newField: 'default' } });
}

async down(db) {
  await db.collection('users').updateMany({}, { $unset: { newField: '' } });
}
```

### 3. Handle Data Safely

When modifying existing data, check for edge cases:

```javascript
async up(db) {
  // Safe: Check if field exists before updating
  await db.collection('users').updateMany(
    { oldField: { $exists: true } },
    { $rename: { oldField: 'newField' } }
  );
}
```

### 4. Index Creation

Create indexes in migrations, not in models:

```javascript
async up(db) {
  await db.collection('users').createIndex(
    { email: 1, organizationId: 1 },
    { unique: true, name: 'email_org_unique' }
  );
}

async down(db) {
  await db.collection('users').dropIndex('email_org_unique');
}
```

### 5. Use Transactions for Complex Changes

For multi-collection changes, use transactions:

```javascript
async up(db, client) {
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      await db.collection('users').updateMany({}, { $set: { version: 2 } }, { session });
      await db.collection('profiles').updateMany({}, { $set: { version: 2 } }, { session });
    });
  } finally {
    await session.endSession();
  }
}
```

## Deployment Integration

Migrations run automatically during deployment via the `pre-deploy` script:

```json
"pre-deploy": "npm run validate-env && npm run migrate && npm run build:prod"
```

## Initial Migration

The initial migration (`20250115000000-initial-schema.js`) creates all indexes for existing collections:

- User indexes (email, role, approval status)
- Lesson indexes (teacher, student, dates)
- Payment indexes (user, status, Stripe session)
- Message indexes (participants, rooms, timestamps)
- Notification indexes (user, read status)
- Material indexes (category, tags)
- Analytics indexes (teacher, dates)

## Troubleshooting

### Migration Fails

Check the changelog collection:

```javascript
db.changelog.find().sort({ appliedAt: -1 })
```

### Rollback Multiple Migrations

```bash
# Rollback last 3 migrations
npm run migrate:down
npm run migrate:down
npm run migrate:down
```

### Reset Migration History

**⚠️ DANGER: Only in development**

```javascript
// In MongoDB shell
db.changelog.drop()
```

Then re-run all migrations:

```bash
npm run migrate
```

## Example Migrations

### Adding a New Field

```javascript
// migrations/20250116000000-add-user-timezone.js
module.exports = {
  async up(db) {
    await db.collection('users').updateMany(
      { timezone: { $exists: false } },
      { $set: { timezone: 'UTC' } }
    );
    await db.collection('users').createIndex({ timezone: 1 });
  },

  async down(db) {
    await db.collection('users').dropIndex('timezone_1');
    await db.collection('users').updateMany({}, { $unset: { timezone: '' } });
  }
};
```

### Renaming a Field

```javascript
// migrations/20250117000000-rename-user-field.js
module.exports = {
  async up(db) {
    await db.collection('users').updateMany(
      {},
      { $rename: { 'oldFieldName': 'newFieldName' } }
    );
  },

  async down(db) {
    await db.collection('users').updateMany(
      {},
      { $rename: { 'newFieldName': 'oldFieldName' } }
    );
  }
};
```

### Data Transformation

```javascript
// migrations/20250118000000-normalize-email.js
module.exports = {
  async up(db) {
    const users = await db.collection('users').find({}).toArray();
    for (const user of users) {
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { email: user.email.toLowerCase() } }
      );
    }
  },

  async down(db) {
    // Cannot reliably reverse email normalization
    console.log('Email normalization cannot be reversed');
  }
};
```

## Production Checklist

Before running migrations in production:

- [ ] Tested in development environment
- [ ] Tested in staging environment
- [ ] Backup created
- [ ] Rollback plan documented
- [ ] Downtime window scheduled (if needed)
- [ ] Team notified
- [ ] Monitoring alerts configured

## Backup Before Migration

Always backup before running migrations in production:

```bash
# MongoDB dump
mongodump --uri="$MONGO_URI" --out=/backup/$(date +%Y%m%d_%H%M%S)

# Run migration
npm run migrate

# Verify
npm run migrate:status
```

## Support

For migration issues:
1. Check logs in `/backend/logs`
2. Verify MongoDB connection
3. Check changelog collection
4. Review migration file syntax
5. Test in development first
