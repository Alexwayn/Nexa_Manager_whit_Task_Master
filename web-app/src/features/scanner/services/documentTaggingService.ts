// Document tagging service for managing tags and categories
import { supabase } from '@/lib/supabaseClient';
import Logger from '@/utils/Logger';

export interface DocumentTag {
  id: string;
  name: string;
  color?: string;
  description?: string;
  category?: string;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TagSuggestion {
  tag: string;
  confidence: number;
  reason: string;
}

export interface DocumentCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isDefault: boolean;
  usageCount: number;
}

export class DocumentTaggingService {
  private readonly TAGS_TABLE = 'document_tags';
  private readonly CATEGORIES_TABLE = 'document_categories';

  /**
   * Get all tags for the current user
   */
  async getUserTags(userId: string): Promise<DocumentTag[]> {
    try {
      const { data, error } = await supabase
        .from(this.TAGS_TABLE)
        .select('*')
        .eq('created_by', userId)
        .order('usage_count', { ascending: false });

      if (error) {
        Logger.error('Failed to get user tags:', error);
        throw new Error(`Failed to get tags: ${error.message}`);
      }

      return (data || []).map(this.mapTagFromDB);
    } catch (error) {
      Logger.error('Failed to get user tags:', error);
      throw error;
    }
  }

  /**
   * Get popular tags across all users (for suggestions)
   */
  async getPopularTags(limit: number = 20): Promise<DocumentTag[]> {
    try {
      const { data, error } = await supabase
        .from(this.TAGS_TABLE)
        .select('name, usage_count')
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (error) {
        Logger.error('Failed to get popular tags:', error);
        throw new Error(`Failed to get popular tags: ${error.message}`);
      }

      return (data || []).map(tag => ({
        id: '',
        name: tag.name,
        usageCount: tag.usage_count,
        createdBy: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    } catch (error) {
      Logger.error('Failed to get popular tags:', error);
      throw error;
    }
  }

  /**
   * Create or update a tag
   */
  async createOrUpdateTag(tagName: string, userId: string, metadata?: Partial<DocumentTag>): Promise<DocumentTag> {
    try {
      const normalizedName = tagName.toLowerCase().trim();

      // Check if tag already exists for this user
      const { data: existingTag, error: findError } = await supabase
        .from(this.TAGS_TABLE)
        .select('*')
        .eq('name', normalizedName)
        .eq('created_by', userId)
        .single();

      if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows returned
        Logger.error('Failed to check existing tag:', findError);
        throw new Error(`Failed to check existing tag: ${findError.message}`);
      }

      if (existingTag) {
        // Update usage count
        const { data, error } = await supabase
          .from(this.TAGS_TABLE)
          .update({
            usage_count: existingTag.usage_count + 1,
            updated_at: new Date().toISOString(),
            ...metadata
          })
          .eq('id', existingTag.id)
          .select()
          .single();

        if (error) {
          Logger.error('Failed to update tag:', error);
          throw new Error(`Failed to update tag: ${error.message}`);
        }

        return this.mapTagFromDB(data);
      } else {
        // Create new tag
        const tagData = {
          name: normalizedName,
          color: metadata?.color || this.generateTagColor(normalizedName),
          description: metadata?.description,
          category: metadata?.category,
          usage_count: 1,
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from(this.TAGS_TABLE)
          .insert([tagData])
          .select()
          .single();

        if (error) {
          Logger.error('Failed to create tag:', error);
          throw new Error(`Failed to create tag: ${error.message}`);
        }

        return this.mapTagFromDB(data);
      }
    } catch (error) {
      Logger.error('Failed to create or update tag:', error);
      throw error;
    }
  }

  /**
   * Suggest tags based on document content and category
   */
  async suggestTags(
    textContent: string, 
    category: string, 
    userId: string,
    existingTags: string[] = []
  ): Promise<TagSuggestion[]> {
    try {
      const suggestions: TagSuggestion[] = [];

      // Category-based suggestions
      const categoryTags = this.getCategoryBasedTags(category);
      categoryTags.forEach(tag => {
        if (!existingTags.includes(tag)) {
          suggestions.push({
            tag,
            confidence: 0.8,
            reason: `Common tag for ${category} documents`
          });
        }
      });

      // Content-based suggestions
      const contentTags = await this.getContentBasedTags(textContent);
      contentTags.forEach(tag => {
        if (!existingTags.includes(tag.tag)) {
          suggestions.push(tag);
        }
      });

      // User's frequently used tags
      const userTags = await this.getUserTags(userId);
      const frequentTags = userTags
        .filter(tag => tag.usageCount > 2 && !existingTags.includes(tag.name))
        .slice(0, 5)
        .map(tag => ({
          tag: tag.name,
          confidence: Math.min(0.6 + (tag.usageCount * 0.05), 0.9),
          reason: `Frequently used tag (${tag.usageCount} times)`
        }));

      suggestions.push(...frequentTags);

      // Sort by confidence and return top suggestions
      return suggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10);
    } catch (error) {
      Logger.error('Failed to suggest tags:', error);
      return [];
    }
  }

  /**
   * Get document categories
   */
  async getDocumentCategories(): Promise<DocumentCategory[]> {
    try {
      const { data, error } = await supabase
        .from(this.CATEGORIES_TABLE)
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) {
        Logger.error('Failed to get document categories:', error);
        throw new Error(`Failed to get categories: ${error.message}`);
      }

      return (data || []).map(this.mapCategoryFromDB);
    } catch (error) {
      Logger.error('Failed to get document categories:', error);
      // Return default categories if database fails
      return this.getDefaultCategories();
    }
  }

  /**
   * Update category usage count
   */
  async updateCategoryUsage(categoryId: string): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('increment_category_usage', { category_id: categoryId });

      if (error) {
        Logger.error('Failed to update category usage:', error);
      }
    } catch (error) {
      Logger.error('Failed to update category usage:', error);
    }
  }

  /**
   * Get tag statistics for a user
   */
  async getTagStatistics(userId: string): Promise<{
    totalTags: number;
    mostUsedTags: Array<{ name: string; count: number }>;
    tagsByCategory: Record<string, number>;
  }> {
    try {
      const tags = await this.getUserTags(userId);

      const totalTags = tags.length;
      const mostUsedTags = tags
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 10)
        .map(tag => ({ name: tag.name, count: tag.usageCount }));

      const tagsByCategory = tags.reduce((acc, tag) => {
        const category = tag.category || 'uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalTags,
        mostUsedTags,
        tagsByCategory
      };
    } catch (error) {
      Logger.error('Failed to get tag statistics:', error);
      return {
        totalTags: 0,
        mostUsedTags: [],
        tagsByCategory: {}
      };
    }
  }

  /**
   * Clean up unused tags
   */
  async cleanupUnusedTags(userId: string, minUsageCount: number = 1): Promise<number> {
    try {
      const { data, error } = await supabase
        .from(this.TAGS_TABLE)
        .delete()
        .eq('created_by', userId)
        .lt('usage_count', minUsageCount)
        .select('id');

      if (error) {
        Logger.error('Failed to cleanup unused tags:', error);
        throw new Error(`Failed to cleanup tags: ${error.message}`);
      }

      const deletedCount = data?.length || 0;
      Logger.info(`Cleaned up ${deletedCount} unused tags for user ${userId}`);
      
      return deletedCount;
    } catch (error) {
      Logger.error('Failed to cleanup unused tags:', error);
      throw error;
    }
  }

  /**
   * Map database record to DocumentTag
   */
  private mapTagFromDB(record: any): DocumentTag {
    return {
      id: record.id,
      name: record.name,
      color: record.color,
      description: record.description,
      category: record.category,
      usageCount: record.usage_count,
      createdBy: record.created_by,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at)
    };
  }

  /**
   * Map database record to DocumentCategory
   */
  private mapCategoryFromDB(record: any): DocumentCategory {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      icon: record.icon,
      color: record.color,
      isDefault: record.is_default,
      usageCount: record.usage_count
    };
  }

  /**
   * Get category-based tag suggestions
   */
  private getCategoryBasedTags(category: string): string[] {
    const categoryTagMap: Record<string, string[]> = {
      'invoice': ['expense', 'financial', 'tax', 'business', 'payment'],
      'receipt': ['expense', 'financial', 'tax', 'purchase', 'reimbursement'],
      'contract': ['legal', 'business', 'important', 'agreement', 'terms'],
      'quote': ['business', 'financial', 'proposal', 'estimate'],
      'business-card': ['contact', 'business', 'reference', 'networking'],
      'id-document': ['personal', 'important', 'reference', 'identity'],
      'report': ['business', 'analysis', 'data', 'summary'],
      'letter': ['correspondence', 'communication', 'formal'],
      'form': ['application', 'official', 'government', 'legal'],
      'other': ['general', 'miscellaneous']
    };

    return categoryTagMap[category] || [];
  }

  /**
   * Get content-based tag suggestions using simple keyword matching
   */
  private async getContentBasedTags(textContent: string): Promise<TagSuggestion[]> {
    const suggestions: TagSuggestion[] = [];
    const lowerContent = textContent.toLowerCase();

    // Financial keywords
    const financialKeywords = ['invoice', 'payment', 'tax', 'vat', 'total', 'amount', 'price', 'cost'];
    const financialMatches = financialKeywords.filter(keyword => lowerContent.includes(keyword));
    if (financialMatches.length > 0) {
      suggestions.push({
        tag: 'financial',
        confidence: 0.7,
        reason: `Contains financial terms: ${financialMatches.join(', ')}`
      });
    }

    // Legal keywords
    const legalKeywords = ['contract', 'agreement', 'terms', 'conditions', 'legal', 'clause'];
    const legalMatches = legalKeywords.filter(keyword => lowerContent.includes(keyword));
    if (legalMatches.length > 0) {
      suggestions.push({
        tag: 'legal',
        confidence: 0.7,
        reason: `Contains legal terms: ${legalMatches.join(', ')}`
      });
    }

    // Urgency keywords
    const urgentKeywords = ['urgent', 'asap', 'immediate', 'deadline', 'due date'];
    const urgentMatches = urgentKeywords.filter(keyword => lowerContent.includes(keyword));
    if (urgentMatches.length > 0) {
      suggestions.push({
        tag: 'urgent',
        confidence: 0.8,
        reason: `Contains urgency indicators: ${urgentMatches.join(', ')}`
      });
    }

    return suggestions;
  }

  /**
   * Generate a color for a tag based on its name
   */
  private generateTagColor(tagName: string): string {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ];

    let hash = 0;
    for (let i = 0; i < tagName.length; i++) {
      hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Get default document categories
   */
  private getDefaultCategories(): DocumentCategory[] {
    return [
      {
        id: 'invoice',
        name: 'Invoice',
        description: 'Bills and invoices',
        icon: 'DocumentTextIcon',
        color: '#3B82F6',
        isDefault: true,
        usageCount: 0
      },
      {
        id: 'receipt',
        name: 'Receipt',
        description: 'Purchase receipts',
        icon: 'DocumentTextIcon',
        color: '#10B981',
        isDefault: true,
        usageCount: 0
      },
      {
        id: 'contract',
        name: 'Contract',
        description: 'Legal contracts and agreements',
        icon: 'DocumentTextIcon',
        color: '#8B5CF6',
        isDefault: true,
        usageCount: 0
      },
      {
        id: 'other',
        name: 'Other',
        description: 'Other documents',
        icon: 'DocumentTextIcon',
        color: '#6B7280',
        isDefault: true,
        usageCount: 0
      }
    ];
  }
}

// Create and export singleton instance
export const documentTaggingService = new DocumentTaggingService();
export default documentTaggingService;