# Nexa Manager Supabase Documentation

This document provides comprehensive technical documentation for the Supabase implementation in the Nexa Manager application, including database structure, integration details, and development considerations for both web and mobile platforms.

## 1. Database Structure

### Tables Overview

| Table Name | Description |
|------------|-------------|
| `users` | Supabase Auth users (managed by Supabase) |
| `clients` | Customer information |
| `events` | Calendar events including appointments, invoices, quotes, etc. |
| `quotes` | Quotes for clients |
| `quote_items` | Line items for quotes |
| `invoices` | Invoices for clients |
| `invoice_items` | Line items for invoices |
| `incomes` | Income transactions |
| `expenses` | Expense transactions |
| `products` | Products/services offered |
| `profiles` | User profiles |
| `settings` | User application settings |

### Table Schemas

#### `users` (Managed by Supabase Auth)

| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| `id` | UUID | Primary key |
| `email` | VARCHAR | User's email (unique) |
| `created_at` | TIMESTAMP | Account creation timestamp |
| `last_sign_in_at` | TIMESTAMP | Last login timestamp |

#### `clients`

| Column Name | Data Type | Description | Constraints |
|-------------|-----------|-------------|------------|
| `id` | UUID | Primary key | `PRIMARY KEY` |
| `created_at` | TIMESTAMP | Creation timestamp | `DEFAULT now()` |
| `updated_at` | TIMESTAMP | Last update timestamp | `DEFAULT now()` |
| `user_id` | UUID | Reference to user | `FOREIGN KEY (users.id)` |
| `full_name` | VARCHAR | Client's full name | `NOT NULL` |
| `email` | VARCHAR | Client's email | |
| `phone` | VARCHAR | Client's phone number | |
| `address` | VARCHAR | Client's address | |
| `city` | VARCHAR | Client's city | |
| `state` | VARCHAR | Client's state/province | |
| `zip` | VARCHAR | Postal/ZIP code | |
| `country` | VARCHAR | Client's country | |
| `notes` | TEXT | Additional notes | |
| `vat_number` | VARCHAR | VAT identification number | |
| `fiscal_code` | VARCHAR | Fiscal code/tax ID | |
| `is_company` | BOOLEAN | Whether client is a company | `DEFAULT false` |

#### `events`

| Column Name | Data Type | Description | Constraints |
|-------------|-----------|-------------|------------|
| `id` | UUID | Primary key | `PRIMARY KEY` |
| `created_at` | TIMESTAMP | Creation timestamp | `DEFAULT now()` |
| `updated_at` | TIMESTAMP | Last update timestamp | `DEFAULT now()` |
| `user_id` | UUID | Reference to user | `FOREIGN KEY (users.id)` |
| `client_id` | UUID | Reference to client | `FOREIGN KEY (clients.id)` |
| `title` | VARCHAR | Event title | `NOT NULL` |
| `description` | TEXT | Event description | |
| `start_date` | DATE | Event start date | `NOT NULL` |
| `end_date` | DATE | Event end date | |
| `all_day` | BOOLEAN | Whether event is all day | `DEFAULT false` |
| `location` | VARCHAR | Event location | |
| `color` | VARCHAR | Event color | |
| `status` | VARCHAR | Event status | |
| `reminder_sent` | BOOLEAN | Whether reminder was sent | `DEFAULT false` |
| `reminder_time` | VARCHAR | Reminder timing | |
| `recurrence_rule` | VARCHAR | iCalendar recurrence rule for repeating events | |
| `category` | VARCHAR | Event type/category | |
| `attendees` | JSONB | Additional event data | |

#### `quotes`

| Column Name | Data Type | Description | Constraints |
|-------------|-----------|-------------|------------|
| `id` | UUID | Primary key | `PRIMARY KEY` |
| `created_at` | TIMESTAMP | Creation timestamp | `DEFAULT now()` |
| `updated_at` | TIMESTAMP | Last update timestamp | `DEFAULT now()` |
| `user_id` | UUID | Reference to user | `FOREIGN KEY (users.id)` |
| `client_id` | UUID | Reference to client | `FOREIGN KEY (clients.id)` |
| `event_id` | UUID | Reference to calendar event | `FOREIGN KEY (events.id)` |
| `quote_number` | VARCHAR | Unique quote/invoice number | `NOT NULL` |
| `issue_date` | DATE | Date when quote/invoice was issued | `NOT NULL` |
| `due_date` | DATE | Payment due date | |
| `status` | VARCHAR | Status (draft, sent, accepted, rejected, etc.) | |
| `notes` | TEXT | Additional notes | |
| `subtotal` | DECIMAL | Sum of all items before tax | `DEFAULT 0` |
| `tax_amount` | DECIMAL | Total tax amount | `DEFAULT 0` |
| `total_amount` | DECIMAL | Total amount including tax | `DEFAULT 0` |
| `payment_method` | VARCHAR | Payment method | |
| `payment_details` | TEXT | Additional payment information | |
| `terms_conditions` | TEXT | Terms and conditions | |
| `is_invoice` | BOOLEAN | Whether it's an invoice (true) or quote (false) | `DEFAULT false` |

#### `quote_items`

| Column Name | Data Type | Description | Constraints |
|-------------|-----------|-------------|------------|
| `id` | UUID | Primary key | `PRIMARY KEY` |
| `created_at` | TIMESTAMP | Creation timestamp | `DEFAULT now()` |
| `updated_at` | TIMESTAMP | Last update timestamp | `DEFAULT now()` |
| `quote_id` | UUID | Reference to event (quote/invoice) | `FOREIGN KEY (events.id)` |
| `description` | TEXT | Item description | `NOT NULL` |
| `quantity` | DECIMAL | Item quantity | `DEFAULT 1` |
| `unit_price` | DECIMAL | Price per unit | `DEFAULT 0` |
| `tax_rate` | DECIMAL | Tax rate percentage | `DEFAULT 0` |
| `amount` | DECIMAL | Total amount (quantity * unit_price) | |

#### `invoices`

| Column Name | Data Type | Description | Constraints |
|-------------|-----------|-------------|------------|
| `id` | UUID | Primary key | `PRIMARY KEY` |
| `created_at` | TIMESTAMP | Creation timestamp | `DEFAULT now()` |
| `updated_at` | TIMESTAMP | Last update timestamp | `DEFAULT now()` |
| `user_id` | UUID | Reference to user | `FOREIGN KEY (users.id)` |
| `client_id` | UUID | Reference to client | `FOREIGN KEY (clients.id)` |
| `event_id` | UUID | Reference to calendar event | `FOREIGN KEY (events.id)` |
| `invoice_number` | VARCHAR | Unique invoice number | `NOT NULL` |
| `issue_date` | DATE | Date when invoice was issued | `NOT NULL` |
| `due_date` | DATE | Payment due date | `NOT NULL` |
| `subtotal` | DECIMAL | Sum of all items before tax | `DEFAULT 0` |
| `tax_amount` | DECIMAL | Total tax amount | `DEFAULT 0` |
| `total_amount` | DECIMAL | Total amount including tax | `DEFAULT 0` |
| `status` | VARCHAR | Status (draft, sent, paid, overdue, cancelled) | `DEFAULT 'draft'` |
| `payment_method` | VARCHAR | Payment method | |
| `notes` | TEXT | Additional notes | |

#### `invoice_items`

| Column Name | Data Type | Description | Constraints |
|-------------|-----------|-------------|------------|
| `id` | UUID | Primary key | `PRIMARY KEY` |
| `created_at` | TIMESTAMP | Creation timestamp | `DEFAULT now()` |
| `updated_at` | TIMESTAMP | Last update timestamp | `DEFAULT now()` |
| `invoice_id` | UUID | Reference to invoice | `FOREIGN KEY (invoices.id)` |
| `description` | TEXT | Item description | `NOT NULL` |
| `quantity` | DECIMAL | Item quantity | `DEFAULT 1` |
| `unit_price` | DECIMAL | Price per unit | `DEFAULT 0` |
| `tax_rate` | DECIMAL | Tax rate percentage | `DEFAULT 0` |
| `amount` | DECIMAL | Total amount (quantity * unit_price) | |

#### `incomes`

| Column Name | Data Type | Description | Constraints |
|-------------|-----------|-------------|------------|
| `id` | UUID | Primary key | `PRIMARY KEY` |
| `created_at` | TIMESTAMP | Creation timestamp | `DEFAULT now()` |
| `updated_at` | TIMESTAMP | Last update timestamp | `DEFAULT now()` |
| `user_id` | UUID | Reference to user | `FOREIGN KEY (users.id)` |
| `invoice_id` | UUID | Reference to invoice | `FOREIGN KEY (invoices.id)` |
| `client_id` | UUID | Reference to client | `FOREIGN KEY (clients.id)` |
| `amount` | DECIMAL | Income amount | `NOT NULL` |
| `date` | DATE | Income date | `NOT NULL` |
| `payment_method` | VARCHAR | Payment method | |
| `description` | TEXT | Income description | |
| `category` | VARCHAR | Income category | |

#### `expenses`

| Column Name | Data Type | Description | Constraints |
|-------------|-----------|-------------|------------|
| `id` | UUID | Primary key | `PRIMARY KEY` |
| `created_at` | TIMESTAMP | Creation timestamp | `DEFAULT now()` |
| `updated_at` | TIMESTAMP | Last update timestamp | `DEFAULT now()` |
| `user_id` | UUID | Reference to user | `FOREIGN KEY (users.id)` |
| `amount` | DECIMAL | Expense amount | `NOT NULL` |
| `date` | DATE | Expense date | `NOT NULL` |
| `payment_method` | VARCHAR | Payment method | |
| `description` | TEXT | Expense description | |
| `category` | VARCHAR | Expense category | |
| `is_tax_deductible` | BOOLEAN | Whether expense is tax deductible | `DEFAULT FALSE` |
| `receipt_url` | VARCHAR | URL to receipt image | |

#### `products`

| Column Name | Data Type | Description | Constraints |
|-------------|-----------|-------------|------------|
| `id` | UUID | Primary key | `PRIMARY KEY` |
| `user_id` | UUID | Reference to user | `FOREIGN KEY (users.id)` |
| `name` | VARCHAR | Product name | `NOT NULL` |
| `description` | TEXT | Product description | |
| `price` | DECIMAL | Product price | |
| `tax_rate` | DECIMAL | Tax rate percentage | |
| `sku` | VARCHAR | Stock keeping unit | |
| `category` | VARCHAR | Product category | |
| `created_at` | TIMESTAMP | Creation timestamp | `DEFAULT now()` |
| `updated_at` | TIMESTAMP | Last update timestamp | `DEFAULT now()` |

#### `profiles`

| Column Name | Data Type | Description | Constraints |
|-------------|-----------|-------------|------------|
| `id` | UUID | Primary key (matches auth.users.id) | `PRIMARY KEY` |
| `updated_at` | TIMESTAMP | Last update timestamp | `DEFAULT now()` |
| `username` | VARCHAR | User's username | |
| `full_name` | VARCHAR | User's full name | |
| `company_name` | VARCHAR | Business name | |
| `company_address` | VARCHAR | Business address | |
| `company_vat` | VARCHAR | VAT/Tax identification number | |
| `company_email` | VARCHAR | Business email | |
| `company_phone` | VARCHAR | Business phone number | |
| `company_logo` | VARCHAR | URL to company logo | |
| `settings` | JSONB | User and application settings | |

#### `settings`

| Column Name | Data Type | Description | Constraints |
|-------------|-----------|-------------|------------|
| `id` | UUID | Primary key | `PRIMARY KEY` |
| `user_id` | UUID | Reference to user | `FOREIGN KEY (users.id)` |
| `business_name` | VARCHAR | Business name | |
| `business_address` | VARCHAR | Business address | |
| `business_phone` | VARCHAR | Business phone | |
| `business_email` | VARCHAR | Business email | |
| `tax_id` | VARCHAR | Tax identification number | |
| `currency` | VARCHAR | Preferred currency | `DEFAULT 'EUR'` |
| `notification_preferences` | JSONB | Notification settings | |
| `theme_preferences` | JSONB | Theme settings | |
| `created_at` | TIMESTAMP | Creation timestamp | `DEFAULT now()` |
| `updated_at` | TIMESTAMP | Last update timestamp | `DEFAULT now()` |

### Relationships

- **User to Clients**: One-to-many (A user can have multiple clients)
- **User to Events**: One-to-many (A user can have multiple events)
- **Client to Events**: One-to-many (A client can be associated with multiple events)
- **User to Quotes**: One-to-many (A user can have multiple quotes)
- **Client to Quotes**: One-to-many (A client can have multiple quotes)
- **Quote to Quote Items**: One-to-many (A quote can have multiple line items)
- **User to Invoices**: One-to-many (A user can have multiple invoices)
- **Client to Invoices**: One-to-many (A client can have multiple invoices)
- **Invoice to Invoice Items**: One-to-many (An invoice can have multiple line items)
- **Event to Invoice**: One-to-one (A calendar event can be linked to an invoice)
- **Event to Quote**: One-to-one (A calendar event can be linked to a quote)
- **User to Incomes**: One-to-many (A user can have multiple income records)
- **Invoice to Incomes**: One-to-many (An invoice can have multiple income records)
- **Client to Incomes**: One-to-many (A client can be associated with multiple income records)
- **User to Expenses**: One-to-many (A user can have multiple expense records)
- **User to Products**: One-to-many (A user can have multiple products)
- **User to Settings**: One-to-one (A user has one settings record)

### Row-Level Security (RLS) Policies

All tables implement Row-Level Security to ensure users can only access their own data:

```sql
-- Example RLS policy for 'events' table
CREATE POLICY "Users can only view their own events"
  ON events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own events"
  ON events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own events"
  ON events
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own events"
  ON events
  FOR DELETE
  USING (auth.uid() = user_id);
```

## 2. Calendar Integration

### Data Flow Overview

The Calendar component integrates with Supabase through the following flow:

1. Calendar events are stored in the `events` table
2. The app fetches events based on user ID when the calendar loads
3. Event creation/editing is handled via Supabase API calls
4. Real-time updates are managed through Supabase's subscription API

### Bidirectional Synchronization

The calendar has been enhanced to support bidirectional synchronization with the financial tables:

1. **Events to Financial Tables**:
   - When an invoice event is created in the calendar, a corresponding record is created in the `invoices` and `invoice_items` tables
   - When an expense event is created, a record is created in the `expenses` table
   - When an income event is created, a record is created in the `incomes` table

2. **Financial Tables to Events**:
   - When invoices are created in the invoices section, they appear in the calendar via the `events` table
   - Records in the `expenses` and `incomes` tables are synchronized to appear in the calendar
   - Each financial record stores a reference to its corresponding calendar event via the `event_id` field

3. **Keeping Data in Sync**:
   - When a calendar event is updated, the corresponding financial record is updated
   - When a financial record is updated, the calendar event is also updated
   - When an event is deleted, cascading deletes remove the corresponding financial records
   - The `syncExistingInvoices` and `syncDocumentsToCalendar` functions handle synchronization of existing data

### Setup Process

1. **Database Configuration**

   The calendar relies on the `events` table with the schema described above. The `attendees` JSONB field allows for flexible event data storage, including:
   
   ```json
   {
     "client_name": "Mario Rossi",
     "start_time": "09:00",
     "end_time": "10:00",
     "priority": "alta",
     "due_date": "2023-05-20",
     "document_number": "FATT-12-05-2023-12345",
     "items": [
       {"description": "Windsurf Lesson", "quantity": 1, "unitPrice": 50, "taxRate": 22}
     ],
     "subtotal": 50,
     "tax": 11,
     "total": 61,
     "payment_method": "contanti",
     "sub_category": "vendite",
     "amount": 61
   }
   ```

2. **Client Integration**

   The client uses the Supabase JavaScript client to connect to the database:

   ```javascript
   // lib/supabaseClient.js
   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
   const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

   export const supabase = createClient(supabaseUrl, supabaseAnonKey);
   ```

3. **Event Fetching**

   Events are fetched using the Supabase client:

   ```javascript
   const fetchEvents = async () => {
     if (!user) return;
     
     try {
       setLoading(true);
       
       const { data, error } = await supabase
         .from('events')
         .select('*')
         .eq('user_id', user.id);
       
       if (error) {
         console.error('Error fetching events:', error);
         return;
       }
       
       // Transform data for the calendar interface
       const formattedEvents = data.map(event => {
         // Extract data from JSONB fields
         let additionalData = {};
         try {
           additionalData = event.attendees ? JSON.parse(event.attendees) : {};
         } catch (e) {
           console.error('Error parsing attendees JSON:', e);
         }
         
         // Format date
         let formattedDate = '';
         try {
           if (typeof event.start_date === 'string' && event.start_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
             formattedDate = event.start_date;
           } else {
             const dateObj = new Date(event.start_date);
             formattedDate = dateObj.toISOString().split('T')[0];
           }
         } catch (e) {
           console.error('Error formatting date:', e, event.start_date);
           formattedDate = new Date().toISOString().split('T')[0];
         }
         
         return {
           id: event.id,
           title: event.title,
           type: event.category, 
           date: formattedDate,
           time: additionalData.start_time || '09:00',
           endTime: additionalData.end_time || '10:00',
           client: additionalData.client_name || '',
           client_id: event.client_id,
           note: event.description || '',
           location: event.location || '',
           priority: additionalData.priority || 'media',
           reminder: event.reminder_time !== null,
           color: event.color || 'bg-blue-500',
           // Other fields based on event type...
         };
       });
       
       setEvents(formattedEvents);
     } catch (error) {
       console.error('Exception fetching events:', error);
     } finally {
       setLoading(false);
     }
   };
   ```

4. **Event Creation/Updating**

   New events are created using the Supabase client:

   ```javascript
   const handleSaveEvent = async (newEvent) => {
     try {
       setLoading(true);
       
       // Get current user
       const { data: userData, error: userError } = await supabase.auth.getUser();
       
       if (userError || !userData || !userData.user) {
         throw new Error('User not authenticated');
       }
       
       // Format dates
       let startDate = newEvent.date;
       let endDate = newEvent.date;
       
       if (startDate && !startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
         const startDateObj = new Date(startDate);
         startDate = startDateObj.toISOString().split('T')[0];
       }
       
       // Prepare event data
       const eventData = {
         user_id: userData.user.id,
         title: newEvent.title,
         description: newEvent.note || '',
         start_date: startDate,
         end_date: endDate,
         all_day: false,
         location: newEvent.location || '',
         color: newEvent.color,
         status: ['preventivo', 'fattura'].includes(newEvent.type) ? newEvent.status : 'active',
         category: newEvent.type,
         client_id: newEvent.client_id,
         reminder_time: newEvent.reminder ? '30' : null,
         reminder_sent: false,
         // Store additional data as JSON
         attendees: JSON.stringify({
           client_name: newEvent.client,
           start_time: newEvent.time,
           end_time: newEvent.endTime,
           priority: newEvent.priority,
           // Additional fields based on event type...
         })
       };
       
       // Save to database
       const { data: savedEvent, error } = await supabase
         .from('events')
         .insert([eventData])
         .select()
         .single();
       
       if (error) {
         console.error('Error saving event:', error);
         alert(`Error saving event: ${error.message}`);
         return;
       }
       
       // Refresh events
       fetchEvents();
       
     } catch (error) {
       console.error('Error saving event:', error);
       alert(`An error occurred: ${error.message}`);
     } finally {
       setLoading(false);
     }
   };
   ```

### Real-Time Updates

The calendar can be configured to use Supabase's real-time API for live updates:

```javascript
useEffect(() => {
  // Subscribe to changes in the events table
  const subscription = supabase
    .from('events')
    .on('*', payload => {
      console.log('Change received!', payload);
      fetchEvents(); // Reload events when changes occur
    })
    .subscribe();

  // Clean up subscription
  return () => {
    supabase.removeSubscription(subscription);
  };
}, [user]);
```

## 3. Authentication Implementation

### Authentication Methods

The application uses Supabase Authentication with the following methods:

1. **Email/Password Authentication**: Standard sign-up and login
2. **Magic Link Authentication**: Passwordless login via email link
3. **OAuth Providers**: Google, Facebook (if configured)

### Implementation

1. **Auth Setup**

   ```javascript
   // context/AuthContext.jsx
   import { createContext, useContext, useEffect, useState } from 'react';
   import { supabase } from '../lib/supabaseClient';

   const AuthContext = createContext();

   export function AuthProvider({ children }) {
     const [user, setUser] = useState(null);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
       // Get initial session
       const getSession = async () => {
         const { data: { session }, error } = await supabase.auth.getSession();
         
         if (error) {
           console.error('Error getting session:', error);
         }
         
         setUser(session?.user || null);
         setLoading(false);
       };

       getSession();

       // Listen for auth changes
       const { data: { subscription } } = supabase.auth.onAuthStateChange(
         (event, session) => {
           setUser(session?.user || null);
           setLoading(false);
         }
       );

       return () => {
         subscription.unsubscribe();
       };
     }, []);

     const value = {
       user,
       loading,
       signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
       signUp: (email, password) => supabase.auth.signUp({ email, password }),
       signOut: () => supabase.auth.signOut(),
       resetPassword: (email) => supabase.auth.resetPasswordForEmail(email),
       updatePassword: (newPassword) => supabase.auth.updateUser({ password: newPassword }),
     };

     return (
       <AuthContext.Provider value={value}>
         {children}
       </AuthContext.Provider>
     );
   }

   export const useAuth = () => {
     return useContext(AuthContext);
   };
   ```

2. **Login Form**

   ```javascript
   const LoginForm = () => {
     const { signIn } = useAuth();
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const [error, setError] = useState(null);
     const [loading, setLoading] = useState(false);

     const handleLogin = async (e) => {
       e.preventDefault();
       setLoading(true);
       setError(null);

       try {
         const { error } = await signIn(email, password);
         if (error) throw error;
       } catch (error) {
         setError(error.message);
       } finally {
         setLoading(false);
       }
     };

     return (
       <form onSubmit={handleLogin}>
         {/* Form fields */}
       </form>
     );
   };
   ```

### User Roles and Permissions

1. **Role-Based Access**

   Supabase supports role-based access control through database roles:

   - `authenticated`: Default role for logged-in users
   - `anon`: Default role for anonymous users
   - Custom roles can be defined for different access levels (admin, manager, user)

2. **Row-Level Security (RLS)**

   RLS policies ensure users can only access their own data:

   ```sql
   -- RLS policy example for clients table
   CREATE POLICY "Users can only access their own clients"
   ON clients
   FOR ALL
   USING (auth.uid() = user_id);
   ```

3. **Function-Level Security**

   For database functions, you can restrict execution based on roles:

   ```sql
   CREATE FUNCTION get_user_statistics(user_uuid UUID)
   RETURNS JSON
   LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public
   AS $$
   BEGIN
     -- Check if the requesting user is the same as the user_uuid parameter
     IF auth.uid() <> user_uuid THEN
       RAISE EXCEPTION 'Unauthorized access';
     END IF;
     
     -- Return statistics data
     RETURN (
       SELECT json_build_object(
         'total_clients', (SELECT COUNT(*) FROM clients WHERE user_id = user_uuid),
         'total_events', (SELECT COUNT(*) FROM events WHERE user_id = user_uuid)
       )
     );
   END;
   $$;
   ```

## 4. API Integration

### Supabase API Endpoints

Supabase provides RESTful API endpoints for all database tables. The primary endpoints used in the application are:

#### Authentication Endpoints

| Endpoint | Function | Example |
|----------|----------|---------|
| `auth.signUp()` | Register a new user | `supabase.auth.signUp({ email, password })` |
| `auth.signInWithPassword()` | Login with email/password | `supabase.auth.signInWithPassword({ email, password })` |
| `auth.signOut()` | Log out the current user | `supabase.auth.signOut()` |
| `auth.resetPasswordForEmail()` | Send password reset email | `supabase.auth.resetPasswordForEmail(email)` |
| `auth.updateUser()` | Update user data | `supabase.auth.updateUser({ email, password, data })` |

#### Data Access Endpoints

| Endpoint | Function | Example |
|----------|----------|---------|
| `from(table).select()` | Retrieve records | `supabase.from('events').select('*')` |
| `from(table).insert()` | Create records | `supabase.from('events').insert([{ ... }])` |
| `from(table).update()` | Update records | `supabase.from('events').update({ title: 'New Title' }).eq('id', eventId)` |
| `from(table).delete()` | Delete records | `supabase.from('events').delete().eq('id', eventId)` |
| `from(table).upsert()` | Insert or update | `supabase.from('events').upsert([{ id: existingId, ... }])` |

### Example Requests and Responses

#### Fetch Events

**Request**:
```javascript
const { data, error } = await supabase
  .from('events')
  .select('*')
  .eq('user_id', userId)
  .gte('start_date', startDate)
  .lte('end_date', endDate);
```

**Response**:
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "a3b8d425-2b60-4f7f-9bd7-6938c97b9ec1",
      "title": "Windsurf Lesson",
      "description": "Group lesson for beginners",
      "start_date": "2023-05-20",
      "end_date": "2023-05-20",
      "all_day": false,
      "location": "Beach Club",
      "color": "bg-blue-500",
      "status": "active",
      "category": "appuntamento",
      "reminder_time": "30",
      "reminder_sent": false,
      "attendees": "{\"client_name\":\"Mario Rossi\",\"start_time\":\"09:00\",\"end_time\":\"10:00\",\"priority\":\"media\"}",
      "created_at": "2023-05-15T14:30:00Z",
      "updated_at": "2023-05-15T14:30:00Z"
    }
  ],
  "error": null
}
```

#### Create Client

**Request**:
```javascript
const { data, error } = await supabase
  .from('clients')
  .insert([{
    user_id: userId,
    full_name: "Mario Rossi",
    email: "mario.rossi@example.com",
    phone: "+39123456789",
    address: "Via Roma 123, Milano"
  }])
  .select()
  .single();
```

**Response**:
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "a3b8d425-2b60-4f7f-9bd7-6938c97b9ec1",
    "full_name": "Mario Rossi",
    "email": "mario.rossi@example.com",
    "phone": "+39123456789",
    "address": "Via Roma 123, Milano",
    "notes": null,
    "created_at": "2023-05-15T15:30:00Z",
    "updated_at": "2023-05-15T15:30:00Z"
  },
  "error": null
}
```

### Rate Limits

Supabase applies the following rate limits by default:

- REST API: 1000 requests per minute per IP
- Authentication: 60 requests per minute per IP
- Storage API: 100 requests per minute per IP

These limits can be adjusted in the Supabase dashboard under Project Settings > API.

## 5. Mobile App Considerations

### Mobile-Specific Configurations

1. **Offline Support**

   Implement local storage for offline functionality:

   ```javascript
   // Store events in local storage
   const cacheEvents = (events) => {
     try {
       localStorage.setItem('cached_events', JSON.stringify(events));
       localStorage.setItem('cache_timestamp', new Date().toISOString());
     } catch (error) {
       console.error('Error caching events:', error);
     }
   };

   // Load cached events when offline
   const loadCachedEvents = () => {
     try {
       const cachedEvents = localStorage.getItem('cached_events');
       if (cachedEvents) {
         return JSON.parse(cachedEvents);
       }
     } catch (error) {
       console.error('Error loading cached events:', error);
     }
     return [];
   };
   ```

2. **Push Notifications**

   For mobile calendar reminders:

   ```javascript
   // Request notification permissions (React Native example)
   const requestNotificationPermissions = async () => {
     const { status: existingStatus } = await Notifications.getPermissionsAsync();
     let finalStatus = existingStatus;
     
     if (existingStatus !== 'granted') {
       const { status } = await Notifications.requestPermissionsAsync();
       finalStatus = status;
     }
     
     if (finalStatus !== 'granted') {
       alert('Failed to get push token for notifications');
       return;
     }
     
     const token = (await Notifications.getExpoPushTokenAsync()).data;
     console.log('Push token:', token);
     
     // Store token in Supabase user metadata
     await supabase.auth.updateUser({
       data: { push_token: token }
     });
   };
   ```

3. **Responsive UI Adaptations**

   ```javascript
   // Screen size detection
   const useScreenSize = () => {
     const [screenSize, setScreenSize] = useState({
       width: Dimensions.get('window').width,
       height: Dimensions.get('window').height
     });
     
     useEffect(() => {
       const updateLayout = () => {
         setScreenSize({
           width: Dimensions.get('window').width,
           height: Dimensions.get('window').height
         });
       };
       
       const subscription = Dimensions.addEventListener('change', updateLayout);
       
       return () => subscription?.remove();
     }, []);
     
     return screenSize;
   };
   
   // In component
   const { width, height } = useScreenSize();
   const isSmallScreen = width < 768;
   
   // Use responsive layouts
   return (
     <View style={isSmallScreen ? styles.smallContainer : styles.largeContainer}>
       {isSmallScreen ? (
         <MobileCalendarView events={events} />
       ) : (
         <DesktopCalendarView events={events} />
       )}
     </View>
   );
   ```

### Mobile vs. Web Implementation Differences

1. **Authentication Flow**

   Mobile apps should implement secure storage for auth tokens:

   ```javascript
   // Secure storage for auth tokens (React Native example)
   import * as SecureStore from 'expo-secure-store';

   // Store session
   const storeSession = async (session) => {
     try {
       await SecureStore.setItemAsync(
         'supabase_session',
         JSON.stringify(session)
       );
     } catch (error) {
       console.error('Error storing session:', error);
     }
   };

   // Get session
   const getSession = async () => {
     try {
       const sessionString = await SecureStore.getItemAsync('supabase_session');
       if (sessionString) {
         return JSON.parse(sessionString);
       }
     } catch (error) {
       console.error('Error getting session:', error);
     }
     return null;
   };
   ```

2. **Touch Interactions**

   Adapt event interactions for touch:

   ```javascript
   // Calendar day touch handler
   const handleDayPress = (day) => {
     const dateString = day.dateString; // YYYY-MM-DD format
     
     // Show events for selected day
     const dayEvents = events.filter(event => event.date === dateString);
     setSelectedDate(dateString);
     setSelectedDayEvents(dayEvents);
     setShowDayDetail(true);
   };
   ```

3. **Navigation**

   Use mobile-native navigation:

   ```javascript
   // React Navigation example
   import { createStackNavigator } from '@react-navigation/stack';
   
   const Stack = createStackNavigator();
   
   function CalendarStack() {
     return (
       <Stack.Navigator>
         <Stack.Screen name="Calendar" component={CalendarScreen} />
         <Stack.Screen name="DayView" component={DayViewScreen} />
         <Stack.Screen name="EventDetail" component={EventDetailScreen} />
         <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
       </Stack.Navigator>
     );
   }
   ```

### Mobile Security Considerations

1. **Biometric Authentication**

   Implement biometric auth for enhanced security:

   ```javascript
   // Biometric authentication (React Native example)
   import * as LocalAuthentication from 'expo-local-authentication';

   const authenticateWithBiometrics = async () => {
     const compatible = await LocalAuthentication.hasHardwareAsync();
     
     if (!compatible) {
       alert('Biometric authentication not available on this device');
       return false;
     }
     
     const enrolled = await LocalAuthentication.isEnrolledAsync();
     
     if (!enrolled) {
       alert('No biometrics enrolled on this device');
       return false;
     }
     
     const result = await LocalAuthentication.authenticateAsync({
       promptMessage: 'Authenticate to access your calendar',
       cancelLabel: 'Cancel',
       fallbackLabel: 'Use Passcode'
     });
     
     return result.success;
   };
   ```

2. **Device Checking**

   Implement device security checks:

   ```javascript
   // Check for rooted/jailbroken devices (React Native example)
   import { isEmulator, isRooted } from 'react-native-device-info';

   const checkDeviceSecurity = async () => {
     const emulator = await isEmulator();
     const rooted = await isRooted();
     
     if (emulator) {
       console.warn('Application running on emulator');
     }
     
     if (rooted) {
       console.warn('Application running on rooted/jailbroken device');
       // Optionally restrict sensitive features
     }
   };
   ```

3. **Secure API Communication**

   Use HTTPS and certificate pinning:

   ```javascript
   // Certificate pinning setup
   import { fetch as pinnedFetch } from 'react-native-ssl-pinning';

   const secureFetch = async (url, options = {}) => {
     try {
       const response = await pinnedFetch(url, {
         ...options,
         sslPinning: {
           certs: ['cert1', 'cert2'] // Certificate hashes
         },
         headers: {
           ...options.headers,
           'Content-Type': 'application/json'
         }
       });
       
       return await response.json();
     } catch (error) {
       console.error('Secure fetch error:', error);
       throw error;
     }
   };
   ```

## Conclusion

This documentation provides a comprehensive overview of the Supabase implementation in the Nexa Manager application. It covers database structure, calendar integration, authentication, API endpoints, and mobile-specific considerations. Use this as a reference for ongoing development and when implementing the mobile version of the application.

For further details on Supabase functionality, refer to the [official Supabase documentation](https://supabase.com/docs). 