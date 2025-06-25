import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key for server-side operations

// Initialize Supabase with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Clerk Webhook Handler
 * 
 * Handles user and organization events from Clerk and syncs data with Supabase.
 * Supports events: user.created, user.updated, user.deleted, 
 * organization.created, organization.updated, organization.deleted,
 * organizationMembership.created, organizationMembership.updated, organizationMembership.deleted
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook signature
    const signature = req.headers['svix-signature'];
    const timestamp = req.headers['svix-timestamp'];
    const payload = JSON.stringify(req.body);

    if (!verifyWebhookSignature(payload, signature, timestamp)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Unauthorized - Invalid signature' });
    }

    const { type, data } = req.body;
    console.log(`Processing Clerk webhook: ${type}`, { userId: data?.id, organizationId: data?.organization?.id });

    let result;
    switch (type) {
      // User Events
      case 'user.created':
        result = await handleUserCreated(data);
        break;
      case 'user.updated':
        result = await handleUserUpdated(data);
        break;
      case 'user.deleted':
        result = await handleUserDeleted(data);
        break;

      // Organization Events
      case 'organization.created':
        result = await handleOrganizationCreated(data);
        break;
      case 'organization.updated':
        result = await handleOrganizationUpdated(data);
        break;
      case 'organization.deleted':
        result = await handleOrganizationDeleted(data);
        break;

      // Organization Membership Events
      case 'organizationMembership.created':
        result = await handleMembershipCreated(data);
        break;
      case 'organizationMembership.updated':
        result = await handleMembershipUpdated(data);
        break;
      case 'organizationMembership.deleted':
        result = await handleMembershipDeleted(data);
        break;

      default:
        console.log(`Unhandled webhook type: ${type}`);
        return res.status(200).json({ message: 'Event type not handled' });
    }

    if (result.success) {
      console.log(`Successfully processed ${type} webhook`);
      return res.status(200).json({ message: 'Webhook processed successfully', result });
    } else {
      console.error(`Failed to process ${type} webhook:`, result.error);
      return res.status(500).json({ error: 'Failed to process webhook', details: result.error });
    }

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

/**
 * Verify webhook signature using Clerk's webhook secret
 */
function verifyWebhookSignature(payload, signature, timestamp) {
  if (!CLERK_WEBHOOK_SECRET || !signature || !timestamp) {
    return false;
  }

  try {
    // Parse the signature header
    const signatures = signature.split(',').reduce((acc, part) => {
      const [key, value] = part.split('=');
      acc[key] = value;
      return acc;
    }, {});

    const expectedSignature = crypto
      .createHmac('sha256', CLERK_WEBHOOK_SECRET)
      .update(`${timestamp}.${payload}`)
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signatures.v1 || '', 'base64'),
      Buffer.from(expectedSignature, 'base64')
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Handle user creation event
 */
async function handleUserCreated(userData) {
  try {
    const userRecord = {
      clerk_user_id: userData.id,
      email: userData.email_addresses?.[0]?.email_address,
      first_name: userData.first_name,
      last_name: userData.last_name,
      profile_image_url: userData.profile_image_url,
      created_at: new Date(userData.created_at).toISOString(),
      updated_at: new Date(userData.updated_at).toISOString(),
      metadata: {
        clerk_data: {
          username: userData.username,
          phone_numbers: userData.phone_numbers,
          external_accounts: userData.external_accounts,
          public_metadata: userData.public_metadata,
          private_metadata: userData.private_metadata,
          unsafe_metadata: userData.unsafe_metadata
        }
      }
    };

    const { data, error } = await supabase
      .from('users')
      .insert([userRecord])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to insert user: ${error.message}`);
    }

    console.log('User created in Supabase:', data.id);
    return { success: true, data, action: 'user_created' };

  } catch (error) {
    console.error('Error handling user.created:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle user update event
 */
async function handleUserUpdated(userData) {
  try {
    const updateData = {
      email: userData.email_addresses?.[0]?.email_address,
      first_name: userData.first_name,
      last_name: userData.last_name,
      profile_image_url: userData.profile_image_url,
      updated_at: new Date(userData.updated_at).toISOString(),
      metadata: {
        clerk_data: {
          username: userData.username,
          phone_numbers: userData.phone_numbers,
          external_accounts: userData.external_accounts,
          public_metadata: userData.public_metadata,
          private_metadata: userData.private_metadata,
          unsafe_metadata: userData.unsafe_metadata
        }
      }
    };

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('clerk_user_id', userData.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    console.log('User updated in Supabase:', data.id);
    return { success: true, data, action: 'user_updated' };

  } catch (error) {
    console.error('Error handling user.updated:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle user deletion event
 */
async function handleUserDeleted(userData) {
  try {
    // Soft delete by marking user as deleted
    const { data, error } = await supabase
      .from('users')
      .update({ 
        deleted_at: new Date().toISOString(),
        active: false
      })
      .eq('clerk_user_id', userData.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }

    console.log('User deleted in Supabase:', data.id);
    return { success: true, data, action: 'user_deleted' };

  } catch (error) {
    console.error('Error handling user.deleted:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle organization creation event
 */
async function handleOrganizationCreated(orgData) {
  try {
    const organizationRecord = {
      clerk_organization_id: orgData.id,
      name: orgData.name,
      slug: orgData.slug,
      logo_url: orgData.logo_url,
      members_count: orgData.members_count || 0,
      created_at: new Date(orgData.created_at).toISOString(),
      updated_at: new Date(orgData.updated_at).toISOString(),
      metadata: {
        clerk_data: {
          public_metadata: orgData.public_metadata,
          private_metadata: orgData.private_metadata
        }
      }
    };

    const { data, error } = await supabase
      .from('organizations')
      .insert([organizationRecord])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to insert organization: ${error.message}`);
    }

    console.log('Organization created in Supabase:', data.id);
    return { success: true, data, action: 'organization_created' };

  } catch (error) {
    console.error('Error handling organization.created:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle organization update event
 */
async function handleOrganizationUpdated(orgData) {
  try {
    const updateData = {
      name: orgData.name,
      slug: orgData.slug,
      logo_url: orgData.logo_url,
      members_count: orgData.members_count || 0,
      updated_at: new Date(orgData.updated_at).toISOString(),
      metadata: {
        clerk_data: {
          public_metadata: orgData.public_metadata,
          private_metadata: orgData.private_metadata
        }
      }
    };

    const { data, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('clerk_organization_id', orgData.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update organization: ${error.message}`);
    }

    console.log('Organization updated in Supabase:', data.id);
    return { success: true, data, action: 'organization_updated' };

  } catch (error) {
    console.error('Error handling organization.updated:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle organization deletion event
 */
async function handleOrganizationDeleted(orgData) {
  try {
    // Soft delete by marking organization as deleted
    const { data, error } = await supabase
      .from('organizations')
      .update({ 
        deleted_at: new Date().toISOString(),
        active: false
      })
      .eq('clerk_organization_id', orgData.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to delete organization: ${error.message}`);
    }

    console.log('Organization deleted in Supabase:', data.id);
    return { success: true, data, action: 'organization_deleted' };

  } catch (error) {
    console.error('Error handling organization.deleted:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle organization membership creation event
 */
async function handleMembershipCreated(membershipData) {
  try {
    const membershipRecord = {
      clerk_membership_id: membershipData.id,
      clerk_organization_id: membershipData.organization.id,
      clerk_user_id: membershipData.public_user_data.user_id,
      role: membershipData.role,
      created_at: new Date(membershipData.created_at).toISOString(),
      updated_at: new Date(membershipData.updated_at).toISOString(),
      metadata: {
        clerk_data: {
          public_user_data: membershipData.public_user_data,
          private_metadata: membershipData.private_metadata,
          public_metadata: membershipData.public_metadata
        }
      }
    };

    const { data, error } = await supabase
      .from('organization_memberships')
      .insert([membershipRecord])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to insert membership: ${error.message}`);
    }

    console.log('Membership created in Supabase:', data.id);
    return { success: true, data, action: 'membership_created' };

  } catch (error) {
    console.error('Error handling organizationMembership.created:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle organization membership update event
 */
async function handleMembershipUpdated(membershipData) {
  try {
    const updateData = {
      role: membershipData.role,
      updated_at: new Date(membershipData.updated_at).toISOString(),
      metadata: {
        clerk_data: {
          public_user_data: membershipData.public_user_data,
          private_metadata: membershipData.private_metadata,
          public_metadata: membershipData.public_metadata
        }
      }
    };

    const { data, error } = await supabase
      .from('organization_memberships')
      .update(updateData)
      .eq('clerk_membership_id', membershipData.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update membership: ${error.message}`);
    }

    console.log('Membership updated in Supabase:', data.id);
    return { success: true, data, action: 'membership_updated' };

  } catch (error) {
    console.error('Error handling organizationMembership.updated:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle organization membership deletion event
 */
async function handleMembershipDeleted(membershipData) {
  try {
    const { data, error } = await supabase
      .from('organization_memberships')
      .delete()
      .eq('clerk_membership_id', membershipData.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to delete membership: ${error.message}`);
    }

    console.log('Membership deleted in Supabase:', data.id);
    return { success: true, data, action: 'membership_deleted' };

  } catch (error) {
    console.error('Error handling organizationMembership.deleted:', error);
    return { success: false, error: error.message };
  }
} 