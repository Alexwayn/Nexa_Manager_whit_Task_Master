import { incomeService } from '@/features/financial/services/incomeService';
import expenseService from '@/features/financial/services/expenseService';
import financialService from '@/features/financial/services/financialService';
import Logger from '@/utils/Logger';

/**
 * Transaction Command Handler
 * Handles voice commands related to financial transactions (income and expenses)
 */

// Interface for transaction command results
export interface TransactionCommandResult {
  type: string;
  command: string;
  config: any;
  confidence: number;
  originalCommand?: string;
  amount?: string | number;
  description?: string;
  category?: string;
}

// Transaction command patterns
export const transactionCommands = {
  // Income commands
  'add income': { type: 'income', action: 'create' },
  'record income': { type: 'income', action: 'create' },
  'new income': { type: 'income', action: 'create' },
  'create income': { type: 'income', action: 'create' },
  'log income': { type: 'income', action: 'create' },
  'add revenue': { type: 'income', action: 'create' },
  'record payment': { type: 'income', action: 'create' },
  'received payment': { type: 'income', action: 'create' },
  
  // Expense commands
  'add expense': { type: 'expense', action: 'create' },
  'record expense': { type: 'expense', action: 'create' },
  'new expense': { type: 'expense', action: 'create' },
  'create expense': { type: 'expense', action: 'create' },
  'log expense': { type: 'expense', action: 'create' },
  'add cost': { type: 'expense', action: 'create' },
  'record purchase': { type: 'expense', action: 'create' },
  'bought something': { type: 'expense', action: 'create' },
  'paid for': { type: 'expense', action: 'create' },
  
  // View commands
  'show income': { type: 'income', action: 'list' },
  'list income': { type: 'income', action: 'list' },
  'my income': { type: 'income', action: 'list' },
  'show expenses': { type: 'expense', action: 'list' },
  'list expenses': { type: 'expense', action: 'list' },
  'my expenses': { type: 'expense', action: 'list' },
  'show transactions': { type: 'both', action: 'list' },
  'list transactions': { type: 'both', action: 'list' },
  'financial overview': { type: 'both', action: 'overview' },
  'financial summary': { type: 'both', action: 'overview' },
  'money overview': { type: 'both', action: 'overview' },
  
  // Search commands
  'find income': { type: 'income', action: 'search' },
  'search income': { type: 'income', action: 'search' },
  'find expense': { type: 'expense', action: 'search' },
  'search expense': { type: 'expense', action: 'search' },
  'find transaction': { type: 'both', action: 'search' },
  'search transaction': { type: 'both', action: 'search' },
  
  // Navigation commands
  'go to finances': { type: 'navigation', action: 'navigate', target: '/financial' },
  'open finances': { type: 'navigation', action: 'navigate', target: '/financial' },
  'show finances': { type: 'navigation', action: 'navigate', target: '/financial' },
  'financial dashboard': { type: 'navigation', action: 'navigate', target: '/financial' },
  'money dashboard': { type: 'navigation', action: 'navigate', target: '/financial' },
};

// All transaction commands for integration
export const allTransactionCommands = Object.keys(transactionCommands);

/**
 * Process transaction-related voice commands
 * @param {string} command - The voice command to process
 * @returns {TransactionCommandResult|null} Command match result
 */
export function processTransactionCommand(command: string): TransactionCommandResult | null {
  const normalizedCommand = command.toLowerCase().trim();
  
  // Check for exact matches first
  if (transactionCommands[normalizedCommand]) {
    return {
      type: 'transaction',
      command: normalizedCommand,
      config: transactionCommands[normalizedCommand],
      confidence: 1.0
    };
  }
  
  // Check for partial matches with amount extraction
  for (const [pattern, config] of Object.entries(transactionCommands)) {
    if (normalizedCommand.includes(pattern)) {
      const result: TransactionCommandResult = {
        type: 'transaction',
        command: pattern,
        config,
        confidence: 0.8,
        originalCommand: command
      };
      
      // Extract amount if present
      const amount = extractAmount(command);
      if (amount) {
        result.amount = amount;
      }
      
      // Extract description/category
      const description = extractDescription(command, pattern);
      if (description) {
        result.description = description;
      }
      
      // Extract category
      const category = extractCategory(command);
      if (category) {
        result.category = category;
      }
      
      return result;
    }
  }
  
  // Check for fuzzy matches
  return processFuzzyTransactionMatches(normalizedCommand);
}

/**
 * Execute transaction commands
 * @param {Object} commandResult - Processed command result
 * @returns {Promise<Object>} Execution result
 */
export async function executeTransactionCommand(commandResult: any): Promise<any> {
  try {
    const { config, amount, description, category } = commandResult;
    
    switch (config.action) {
      case 'create':
        return await handleCreateTransaction(config.type, { amount, description, category });
      case 'list':
        return await handleListTransactions(config.type);
      case 'search':
        return await handleSearchTransactions(config.type, description);
      case 'overview':
        return await handleFinancialOverview();
      case 'navigate':
        return await handleNavigateToFinances(config.target);
      default:
        return {
          success: false,
          message: `Unknown transaction action: ${config.action}`
        };
    }
  } catch (error) {
    Logger.error('Error executing transaction command:', error);
    return {
      success: false,
      message: `Error executing transaction command: ${String(error instanceof Error ? error.message : error)}`
    };
  }
}

/**
 * Handle creating a new transaction (income or expense)
 */
async function handleCreateTransaction(type: string, data: any): Promise<any> {
  try {
    if (!data.amount) {
      return {
        success: false,
        message: 'Please specify an amount for the transaction',
        requiresInput: true,
        inputType: 'amount'
      };
    }
    
    const transactionData = {
      amount: parseFloat(data.amount),
      description: data.description || 'Voice command transaction',
      category: data.category || 'General',
      date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };
    
    let result;
    if (type === 'income') {
      // Get current user ID (this should be handled by the service)
      result = await incomeService.createIncome(transactionData, null);
    } else if (type === 'expense') {
      result = await expenseService.createExpense(transactionData);
    }
    
    if (result && (result.success !== false)) {
      return {
        success: true,
        message: `${type === 'income' ? 'Income' : 'Expense'} of $${data.amount} added successfully`,
        data: result
      };
    } else {
      throw new Error(result?.error || 'Failed to create transaction');
    }
  } catch (error) {
    Logger.error(`Error creating ${type}:`, error);
    return {
      success: false,
      message: `Failed to add ${type}: ${String(error instanceof Error ? error.message : error)}`
    };
  }
}

/**
 * Handle listing transactions
 */
async function handleListTransactions(type: string): Promise<any> {
  try {
    let result;
    
    if (type === 'income') {
      result = await incomeService.getIncomes(null);
      return {
        success: true,
        message: `Found ${result.length} income records`,
        data: result,
        type: 'income'
      };
    } else if (type === 'expense') {
      result = await expenseService.getExpenses();
      return {
        success: true,
        message: `Found ${result.length} expense records`,
        data: result,
        type: 'expense'
      };
    } else if (type === 'both') {
      const [incomes, expenses] = await Promise.all([
        incomeService.getIncomes(null),
        expenseService.getExpenses()
      ]);
      
      return {
        success: true,
        message: `Found ${incomes.length} income and ${expenses.length} expense records`,
        data: { incomes, expenses },
        type: 'both'
      };
    }
  } catch (error) {
    Logger.error('Error listing transactions:', error);
    return {
      success: false,
      message: `Failed to retrieve transactions: ${String(error instanceof Error ? error.message : error)}`
    };
  }
}

/**
 * Handle searching transactions
 */
async function handleSearchTransactions(type: string, searchTerm: string): Promise<any> {
  try {
    if (!searchTerm) {
      return {
        success: false,
        message: 'Please specify what to search for',
        requiresInput: true,
        inputType: 'search'
      };
    }
    
    // For now, we'll get all transactions and filter client-side
    // In a real implementation, you'd want to add search capabilities to the services
    let result;
    
    if (type === 'income') {
      const allIncomes = await incomeService.getIncomes(null);
      result = allIncomes.filter(income => 
        income.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        income.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else if (type === 'expense') {
      const allExpenses = await expenseService.getExpenses();
      result = allExpenses.filter(expense => 
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return {
      success: true,
      message: `Found ${result.length} matching ${type} records`,
      data: result,
      searchTerm
    };
  } catch (error) {
    Logger.error('Error searching transactions:', error);
    return {
      success: false,
      message: `Failed to search transactions: ${String(error instanceof Error ? error.message : error)}`
    };
  }
}

/**
 * Handle financial overview
 */
async function handleFinancialOverview(): Promise<any> {
  try {
    const result = await financialService.getFinancialOverview();
    
    if (result.success) {
      const { income, expenses, netProfit } = result.data;
      return {
        success: true,
        message: `Financial Overview: Income $${income.total.toFixed(2)}, Expenses $${expenses.total.toFixed(2)}, Net Profit $${netProfit.toFixed(2)}`,
        data: result.data
      };
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    Logger.error('Error getting financial overview:', error);
    return {
      success: false,
      message: `Failed to get financial overview: ${String(error instanceof Error ? error.message : error)}`
    };
  }
}

/**
 * Handle navigation to finances
 */
async function handleNavigateToFinances(target: string): Promise<any> {
  return {
    success: true,
    action: 'navigate',
    target,
    message: 'Navigating to financial dashboard'
  };
}

/**
 * Extract amount from command text
 */
function extractAmount(command: string): number | null {
  // Look for patterns like "$100", "100 dollars", "100.50", etc.
  const amountPatterns = [
    /\$(\d+(?:\.\d{2})?)/,           // $100, $100.50
    /(\d+(?:\.\d{2})?)\s*dollars?/i, // 100 dollars, 100.50 dollar
    /(\d+(?:\.\d{2})?)\s*bucks?/i,   // 100 bucks
    /(\d+(?:\.\d{2})?)\s*euros?/i,   // 100 euros
    /(\d+(?:\.\d{2})?)/              // Just numbers
  ];
  
  for (const pattern of amountPatterns) {
    const match = command.match(pattern);
    if (match) {
      const amount = parseFloat(match[1]);
      if (!isNaN(amount) && amount > 0) {
        return amount;
      }
    }
  }
  
  return null;
}

/**
 * Extract description from command
 */
function extractDescription(command: string, pattern: string): string | null {
  // Remove the command pattern and amount to get description
  let description = command.toLowerCase().replace(pattern, '').trim();
  
  // Remove amount patterns
  description = description.replace(/\$\d+(?:\.\d{2})?/g, '');
  description = description.replace(/\d+(?:\.\d{2})?\s*dollars?/gi, '');
  description = description.replace(/\d+(?:\.\d{2})?\s*bucks?/gi, '');
  description = description.replace(/\d+(?:\.\d{2})?\s*euros?/gi, '');
  
  // Remove common words
  description = description.replace(/\b(for|of|from|to|the|a|an)\b/g, '');
  
  description = description.trim();
  
  return description.length > 2 ? description : null;
}

/**
 * Extract category from command
 */
function extractCategory(command: string): string | null {
  const categoryKeywords = {
    'food': ['food', 'restaurant', 'lunch', 'dinner', 'breakfast', 'meal', 'grocery'],
    'transport': ['gas', 'fuel', 'uber', 'taxi', 'bus', 'train', 'transport'],
    'office': ['office', 'supplies', 'equipment', 'software', 'subscription'],
    'utilities': ['electricity', 'water', 'internet', 'phone', 'utilities'],
    'entertainment': ['movie', 'game', 'entertainment', 'fun', 'hobby'],
    'health': ['doctor', 'medicine', 'health', 'medical', 'pharmacy'],
    'consulting': ['consulting', 'service', 'project', 'client', 'work'],
    'sales': ['sale', 'product', 'revenue', 'commission']
  };
  
  const lowerCommand = command.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerCommand.includes(keyword))) {
      return category;
    }
  }
  
  return null;
}

/**
 * Process fuzzy matches for transaction commands
 */
function processFuzzyTransactionMatches(command: string): TransactionCommandResult | null {
  const fuzzyPatterns = {
    // Income variations
    'income': ['incme', 'incom', 'revenue', 'earning', 'payment'],
    'expense': ['expens', 'cost', 'spend', 'purchase', 'buy'],
    'add': ['ad', 'create', 'new', 'record', 'log'],
    'show': ['list', 'display', 'view', 'see'],
    'financial': ['finance', 'money', 'cash', 'budget']
  };
  
  for (const [correct, variations] of Object.entries(fuzzyPatterns)) {
    for (const variation of variations) {
      if (command.includes(variation)) {
        // Try to build a corrected command
        const correctedCommand = command.replace(variation, correct);
        
        // Check if the corrected command matches any patterns
        for (const [pattern, config] of Object.entries(transactionCommands)) {
          if (correctedCommand.includes(pattern)) {
            return {
              type: 'transaction',
              command: pattern,
              config,
              confidence: 0.6,
              originalCommand: command
            };
          }
        }
      }
    }
  }
  
  return null;
}

export default {
  processTransactionCommand,
  executeTransactionCommand,
  allTransactionCommands,
  transactionCommands
};