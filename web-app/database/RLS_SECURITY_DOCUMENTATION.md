# 🔒 Row Level Security (RLS) Implementation Guide
## Nexa Manager - Database-Level Security Documentation

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [RLS Architecture](#rls-architecture)
3. [Protected Tables](#protected-tables)
4. [Security Policies](#security-policies)
5. [Implementation Details](#implementation-details)
6. [Testing & Validation](#testing--validation)
7. [Client-Side Cleanup](#client-side-cleanup)
8. [Maintenance Guidelines](#maintenance-guidelines)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Row Level Security (RLS) is a PostgreSQL feature that allows database administrators to restrict access to rows in a table based on the characteristics of the user executing the query. In Nexa Manager, RLS ensures complete data isolation between users at the database level, eliminating the need for client-side filtering and providing robust security.

### Key Benefits

- **🛡️ Defense in Depth**: Security enforced at the database level
- **🚀 Performance**: Eliminates unnecessary client-side filtering
- **🔒 Data Isolation**: Complete separation between user data
- **🐛 Bug Prevention**: Reduces likelihood of authorization bugs
- **📊 Audit Trail**: All access is logged at database level

---

## 🏗️ RLS Architecture

### Security Model

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │───▶│   Supabase      │───▶│   PostgreSQL    │
│                 │    │   (Middleware)  │    │   (RLS Engine)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         │                        │              ┌─────────────────┐
         │                        │              │ RLS Policies    │
         │                        │              │ ┌─────────────┐ │
         │                        │              │ │ auth.uid()  │ │
         └────────────────────────┼──────────────┤ │   checks    │ │
                                  │              │ └─────────────┘ │
                                  │              └─────────────────┘
                                  ▼
                        ┌─────────────────┐
                        │ Filtered Data   │
                        │ (User-specific) │
                        └─────────────────┘
```

### Authentication Flow

1. **User Authentication**: User logs in via Supabase Auth
2. **JWT Token**: Supabase generates JWT with `auth.uid()`
3. **Database Connection**: Token passed to PostgreSQL
4. **RLS Evaluation**: PostgreSQL evaluates policies using `auth.uid()`
5. **Data Filtering**: Only authorized rows returned

---

## 📊 Protected Tables

All tables containing user-specific data are protected with comprehensive RLS policies:

### Core Business Tables

| Table | RLS Status | Policies | Description |
|-------|------------|----------|-------------|
| `profiles` | ✅ Enabled | SELECT, UPDATE | User profile information |
| `clients` | ✅ Enabled | ALL (CRUD) | Client management |
| `invoices` | ✅ Enabled | ALL (CRUD) | Invoice records |
| `quotes` | ✅ Enabled | ALL (CRUD) | Quote/estimate records |
| `appointments` | ✅ Enabled | ALL (CRUD) | Calendar appointments |
| `events` | ✅ Enabled | ALL (CRUD) | Calendar events |
| `expenses` | ✅ Enabled | ALL (CRUD) | Expense tracking |
| `incomes` | ✅ Enabled | ALL (CRUD) | Income tracking |

### Related/Child Tables

| Table | RLS Status | Policies | Parent Table |
|-------|------------|----------|--------------|
| `invoice_items` | ✅ Enabled | ALL (CRUD) | `invoices` |
| `quote_items` | ✅ Enabled | ALL (CRUD) | `quotes` |

### Document Management

| Table | RLS Status | Policies | Description |
|-------|------------|----------|-------------|
| `documents` | ✅ Enabled | ALL (CRUD) | File/document storage |

### Event Management

| Table | RLS Status | Policies | Description |
|-------|------------|----------|-------------|
| `event_invitations` | ✅ Enabled | ALL (CRUD) | Event invitation system |
| `event_attendees` | ✅ Enabled | ALL (CRUD) | Attendee management |
| `event_comments` | ✅ Enabled | ALL (CRUD) | Event discussions |
| `event_attachments` | ✅ Enabled | ALL (CRUD) | Event file attachments |

### Advanced Features

| Table | RLS Status | Policies | Description |
|-------|------------|----------|-------------|
| `recurrence_rules` | ✅ Enabled | ALL (CRUD) | Recurring event patterns |
| `event_reminders` | ✅ Enabled | ALL (CRUD) | Event notifications |
| `notification_queue` | ✅ Enabled | ALL (CRUD) | Notification processing |
| `user_notification_preferences` | ✅ Enabled | ALL (CRUD) | User notification settings |
| `in_app_notifications` | ✅ Enabled | ALL (CRUD) | In-app notification system |

---

## 🛡️ Security Policies

### Policy Types

#### 1. Direct User Ownership Policies

For tables with direct `user_id` columns:

```sql
-- Example: clients table
CREATE POLICY "Users can view their own clients" ON clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" ON clients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" ON clients
  FOR DELETE USING (auth.uid() = user_id);
```

#### 2. Parent Table JOIN Policies

For child tables that reference parent tables:

```sql
-- Example: invoice_items table
CREATE POLICY "Users can view their own invoice items" ON invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );
```

#### 3. Profile-Based Policies

For the profiles table (special case):

```sql
-- Profiles table uses id = auth.uid() instead of user_id
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
```

#### 4. Special Access Policies

For event invitations (allows both owner and invitee access):

```sql
-- Event owner access
CREATE POLICY "Users can view invitations for their events" 
ON event_invitations FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = event_invitations.event_id 
    AND events.user_id = auth.uid()
));

-- Invitee access  
CREATE POLICY "Invitees can view their own invitations" 
ON event_invitations FOR SELECT 
USING (invitee_email = auth.email() OR invitation_token IS NOT NULL);
```

---

## 🔧 Implementation Details

### Policy Naming Convention

```
"Users can {operation} {scope}" ON {table_name}
```

Examples:
- `"Users can view their own clients"`
- `"Users can insert their own invoices"`
- `"Users can update their own profile"`

### Key Functions Used

- **`auth.uid()`**: Returns current authenticated user's UUID
- **`auth.email()`**: Returns current authenticated user's email
- **`EXISTS()`**: Used for JOIN-based policies

### Performance Considerations

1. **Indexes**: All `user_id` columns are indexed for optimal performance
2. **Query Planning**: PostgreSQL optimizes RLS policies in query execution
3. **JOIN Optimization**: Parent table lookups are efficient with proper indexes

---

## 🧪 Testing & Validation

### Automated Testing

The project includes a comprehensive test suite:

```javascript
// Run RLS security tests
import { runRLSSecurityTests } from '../utils/rls-security-tests.js';

const results = await runRLSSecurityTests();
```

### Test Categories

1. **Data Isolation**: Verify users only see their own data
2. **Insert Security**: Ensure proper user_id assignment
3. **Update/Delete Security**: Verify operations on own data only
4. **JOIN Security**: Test child table access through parent relationships
5. **Real-time Security**: Validate subscription filtering
6. **Storage Security**: Check file access controls

### Manual Testing Checklist

- [ ] Create test users with different data sets
- [ ] Verify data isolation between users
- [ ] Test unauthorized access attempts
- [ ] Validate all CRUD operations
- [ ] Check real-time subscription filtering
- [ ] Verify error handling for unauthorized operations

---

## 🧹 Client-Side Cleanup

### Redundant Filtering Patterns

With RLS in place, these client-side patterns are no longer needed:

```javascript
// ❌ BEFORE: Manual user_id filtering (redundant with RLS)
const { data } = await supabase
  .from('clients')
  .select('*')
  .eq('user_id', user.id);  // ← This filtering is redundant

// ✅ AFTER: Clean query (RLS handles filtering)
const { data } = await supabase
  .from('clients')
  .select('*');
```

### Files Requiring Cleanup

Based on analysis, these files have redundant `user_id` filtering:

1. **Service Layer**:
   - `clientService.js`
   - `invoiceService.js` 
   - `quoteService.js`
   - `notificationService.js`
   - `invoiceLifecycleService.js`
   - `eventInvitationService.js`

2. **Component Layer**:
   - `Settings.jsx`
   - `Clients.jsx`
   - `QuoteToInvoiceConverter.jsx`

3. **Real-time Layer**:
   - `realtimeService.js` (partial cleanup - subscriptions may need filtering for performance)

### Migration Strategy

1. **Phase 1**: Validate RLS is working with current filtering
2. **Phase 2**: Remove redundant SELECT filtering
3. **Phase 3**: Remove redundant INSERT user_id (if policies auto-assign)
4. **Phase 4**: Update real-time subscriptions (carefully)
5. **Phase 5**: Comprehensive testing

---

## 🔧 Maintenance Guidelines

### Adding New Tables

When adding new tables with user data:

1. **Enable RLS**:
   ```sql
   ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
   ```

2. **Create Policies**:
   ```sql
   CREATE POLICY "Users can view their own records" ON new_table
     FOR SELECT USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can insert their own records" ON new_table
     FOR INSERT WITH CHECK (auth.uid() = user_id);
   
   CREATE POLICY "Users can update their own records" ON new_table
     FOR UPDATE USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can delete their own records" ON new_table
     FOR DELETE USING (auth.uid() = user_id);
   ```

3. **Test Policies**:
   - Run RLS validation script
   - Test with multiple users
   - Verify data isolation

### Policy Modifications

When modifying existing policies:

1. **Backup Current Policies**:
   ```sql
   -- Document current policy definitions
   SELECT * FROM pg_policies WHERE tablename = 'target_table';
   ```

2. **Test in Development**:
   - Apply changes in dev environment
   - Run full test suite
   - Verify no data leakage

3. **Deploy Safely**:
   - Use transactions for policy updates
   - Monitor for policy violations
   - Have rollback plan ready

### Monitoring

Set up monitoring for:

- **Policy Violations**: Track unauthorized access attempts
- **Performance Impact**: Monitor query performance with RLS
- **Policy Coverage**: Ensure all user tables have RLS

---

## 🚨 Troubleshooting

### Common Issues

#### 1. "Permission Denied" Errors

**Symptom**: Queries fail with permission denied
**Cause**: Missing or overly restrictive policies
**Solution**:
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'your_table';

-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

#### 2. Data Not Appearing

**Symptom**: Queries return empty results
**Cause**: Policies too restrictive or auth.uid() mismatch
**Solution**:
```sql
-- Test auth.uid() function
SELECT auth.uid();

-- Check user_id in your data
SELECT user_id FROM your_table LIMIT 5;
```

#### 3. Performance Issues

**Symptom**: Slow queries after enabling RLS
**Cause**: Missing indexes or complex policy conditions
**Solution**:
```sql
-- Add indexes on user_id columns
CREATE INDEX IF NOT EXISTS idx_table_user_id ON table_name(user_id);

-- Analyze query plans
EXPLAIN ANALYZE SELECT * FROM your_table;
```

#### 4. Real-time Issues

**Symptom**: Real-time subscriptions not filtering correctly
**Cause**: Client-side filtering conflict with RLS
**Solution**:
- Remove client-side user_id filters from subscriptions
- Let RLS handle filtering at database level
- Monitor subscription performance

### Debug Queries

```sql
-- Check RLS status for all tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- View all policies
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test current user authentication
SELECT 
  auth.uid() as current_user_id,
  auth.email() as current_user_email;
```

---

## 📋 Security Checklist

- [ ] All user data tables have RLS enabled
- [ ] All tables have appropriate policies for CRUD operations
- [ ] Child tables use JOIN policies to parent tables
- [ ] Real-time subscriptions respect RLS filtering
- [ ] Storage buckets have user-scoped policies
- [ ] Test suite validates data isolation
- [ ] Client-side redundant filtering removed
- [ ] Performance impact assessed and optimized
- [ ] Monitoring set up for policy violations
- [ ] Documentation updated for new tables/policies

---

## 📚 Additional Resources

- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [RLS Best Practices](https://www.postgresql.org/docs/current/ddl-rowsecurity.html#DDL-ROWSECURITY-POLICIES)

---

**Last Updated**: `[Task 54 Implementation Date]`  
**Version**: `1.0`  
**Maintained By**: Nexa Manager Development Team 