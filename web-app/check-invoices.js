// Script to check for specific invoice numbers in the invoices table
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase client configuration - using environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing required environment variable: VITE_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing required environment variable: VITE_SUPABASE_ANON_KEY');
}

// Create the client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  schema: {
    cacheControl: { useCache: false },
  },
  auth: {
    persistSession: false,
  },
});

// Invoice numbers to check
const invoiceNumbers = ['FATT-06-05-2025-1150', 'FATT-06-05-2025-5274', 'FATT-06-05-2025-6091'];

async function checkInvoices() {
  console.log('Checking invoices table for specific invoice numbers...');

  try {
    // For each invoice number
    for (const invoiceNumber of invoiceNumbers) {
      console.log(`\nChecking for invoice number: ${invoiceNumber}`);

      // Check in invoices table
      const { data: invoices, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('invoice_number', invoiceNumber);

      if (invoiceError) {
        console.error(`Error checking invoices table for ${invoiceNumber}:`, invoiceError);
        continue;
      }

      if (invoices && invoices.length > 0) {
        console.log(`Found ${invoices.length} matching invoice(s):`);
        for (const invoice of invoices) {
          console.log(
            `- ID: ${invoice.id}, Number: ${invoice.invoice_number}, Status: ${invoice.status}, Event ID: ${invoice.event_id || 'none'}`,
          );
        }
      } else {
        console.log(`No invoices found with number: ${invoiceNumber}`);
      }

      // Check in quotes table
      const { data: quotes, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('quote_number', invoiceNumber);

      if (quoteError) {
        console.error(`Error checking quotes table for ${invoiceNumber}:`, quoteError);
        continue;
      }

      if (quotes && quotes.length > 0) {
        console.log(`Found ${quotes.length} matching quote(s):`);
        for (const quote of quotes) {
          console.log(
            `- ID: ${quote.id}, Number: ${quote.quote_number}, Status: ${quote.status}, Event ID: ${quote.event_id || 'none'}`,
          );
        }
      } else {
        console.log(`No quotes found with number: ${invoiceNumber}`);
      }
    }
  } catch (err) {
    console.error('Exception in checking invoices:', err);
  }
}

// Run the function
checkInvoices()
  .then(() => console.log('\nCheck completed.'))
  .catch((err) => console.error('\nCheck failed:', err));
