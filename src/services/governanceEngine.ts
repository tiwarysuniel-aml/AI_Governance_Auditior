export type RiskCategory = 
  | 'PII'
  | 'Sensitive Info'
  | 'Prompt Injection'
  | 'Privacy'
  | 'Compliance'
  | 'Security'
  | 'Toxicity';

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface DetectedRisk {
  id: string;
  category: RiskCategory;
  name: string;
  severity: SeverityLevel;
  evidence: string;
  location: 'prompt' | 'response' | 'both';
  recommendation: string;
}

export interface GovernanceReport {
  score: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  detectedRisks: DetectedRisk[];
  timestamp: string;
  promptCharCount: number;
  responseCharCount: number;
  categories: Record<RiskCategory, { count: number; scoreImpact: number }>;
}

// Rules configuration
interface ScanningRule {
  category: RiskCategory;
  name: string;
  severity: SeverityLevel;
  pattern: RegExp;
  recommendation: string;
  scoreImpact: number;
}

const GOVERNANCE_RULES: ScanningRule[] = [
  // 1. PII Exposure
  {
    category: 'PII',
    name: 'Email Address Exposure',
    severity: 'Medium',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
    recommendation: 'Mask or remove personal email addresses before submission.',
    scoreImpact: 15,
  },
  {
    category: 'PII',
    name: 'Phone Number Exposure',
    severity: 'Medium',
    pattern: /(\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/g,
    recommendation: 'Redact phone numbers to protect personal contact details.',
    scoreImpact: 15,
  },
  {
    category: 'PII',
    name: 'Aadhaar Card Number Detection',
    severity: 'High',
    pattern: /\b\d{4}[- ]\d{4}[- ]\d{4}\b|\b\d{12}\b/g,
    recommendation: 'Aadhaar numbers are highly sensitive. De-identify or mask them immediately.',
    scoreImpact: 25,
  },
  {
    category: 'PII',
    name: 'PAN Card Number Detection',
    severity: 'High',
    pattern: /\b[A-Z]{5}\d{4}[A-Z]{1}\b/gi,
    recommendation: 'PAN numbers are sensitive government identifiers. Mask before submission.',
    scoreImpact: 25,
  },
  {
    category: 'PII',
    name: 'Passport Number Detection',
    severity: 'High',
    pattern: /\b[A-Z]{1}\d{7,8}\b/gi,
    recommendation: 'Passport numbers present identity theft risks. Redact them immediately.',
    scoreImpact: 25,
  },
  {
    category: 'PII',
    name: 'Employee ID Detection',
    severity: 'Low',
    pattern: /\b(EMP-\d{3,6}|E\d{5,8})\b/gi,
    recommendation: 'Avoid sharing internal corporate employee identifiers.',
    scoreImpact: 5,
  },

  // 2. Sensitive Information / Secret Keys
  {
    category: 'Sensitive Info',
    name: 'Stripe API Key Detection',
    severity: 'Critical',
    pattern: /\bsk_live_[a-zA-Z0-9]{24,}\b/g,
    recommendation: 'Remove production API credentials immediately to prevent unauthorized financial operations.',
    scoreImpact: 35,
  },
  {
    category: 'Sensitive Info',
    name: 'Google API Key Detection',
    severity: 'Critical',
    pattern: /\bAIzaSy[a-zA-Z0-9-_]{33}\b/g,
    recommendation: 'Google API key exposed. Revoke immediately and remove from submission.',
    scoreImpact: 35,
  },
  {
    category: 'Sensitive Info',
    name: 'Generic API Key / Token',
    severity: 'High',
    pattern: /\b(api[_-]?key|secret|token|password|passwd|private[_-]?key)\s*[:=]\s*['"]?[a-zA-Z0-9-_+/=]{16,}['"]?/gi,
    recommendation: 'Remove passwords, secret tokens, or cryptographic keys before sending data.',
    scoreImpact: 25,
  },
  {
    category: 'Sensitive Info',
    name: 'Database URL / Connection String',
    severity: 'High',
    pattern: /\b(mongodb\+srv|postgres|postgresql|mysql|mssql|redis):\/\/[^\s'"]+/gi,
    recommendation: 'Do not expose database connection details (hostnames, usernames, or passwords).',
    scoreImpact: 30,
  },
  {
    category: 'Sensitive Info',
    name: 'Private IP Address Leak',
    severity: 'Medium',
    pattern: /\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b|\b172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}\b|\b192\.168\.\d{1,3}\.\d{1,3}\b/g,
    recommendation: 'Ensure internal network layouts (private IP ranges) are kept confidential.',
    scoreImpact: 10,
  },
  {
    category: 'Sensitive Info',
    name: 'Internal URL Detection',
    severity: 'Medium',
    pattern: /\b[a-zA-Z0-9-_.]+\.(local|internal|lan)\b/gi,
    recommendation: 'Avoid referencing internal domain configurations.',
    scoreImpact: 10,
  },

  // 3. Prompt Injection
  {
    category: 'Prompt Injection',
    name: 'Instruction Bypass Attempt',
    severity: 'Critical',
    pattern: /ignore\s+(previous|prior|above)\s+instructions/gi,
    recommendation: 'Prompt attempts to override the system instructions. Filter or block this query.',
    scoreImpact: 35,
  },
  {
    category: 'Prompt Injection',
    name: 'System Prompt Extraction',
    severity: 'Critical',
    pattern: /reveal\s+system\s+prompt|show\s+(hidden|system)\s+instructions|print\s+(the\s+)?system\s+prompt/gi,
    recommendation: 'Detecting system prompt extraction attempts. Prevent disclosure of underlying instruction sets.',
    scoreImpact: 35,
  },
  {
    category: 'Prompt Injection',
    name: 'Jailbreak Pattern (DAN)',
    severity: 'Critical',
    pattern: /\b(DAN|Do\s+Anything\s+Now|jailbreak|developer\s+mode\s+active|bypass\s+security\s+filter)\b/gi,
    recommendation: 'Jailbreak attempt identified. Revise input guidelines to lock down LLM behaviors.',
    scoreImpact: 35,
  },
  {
    category: 'Prompt Injection',
    name: 'Role Override Attempt',
    severity: 'High',
    pattern: /you\s+are\s+now\s+a\s+[^.!?]+|override\s+your\s+role|act\s+as\s+(an?|the)\s+[^.!?]+/gi,
    recommendation: 'User attempting to force a role override. Enforce target guardrails.',
    scoreImpact: 20,
  },

  // 4. Privacy Risk
  {
    category: 'Privacy',
    name: 'Salary or Financial Records Disclosure',
    severity: 'High',
    pattern: /\b(salary|payroll|payslip|credit\s+card|bank\s+account|routing\s+number)\b/gi,
    recommendation: 'Financial records contain highly restricted information. Apply strict de-identification rules.',
    scoreImpact: 25,
  },
  {
    category: 'Privacy',
    name: 'Customer Registry Data',
    severity: 'Medium',
    pattern: /\b(customer\s+list|customer\s+names|client\s+database|mailing\s+list)\b/gi,
    recommendation: 'Prevent uploading entire databases of customer names or addresses.',
    scoreImpact: 15,
  },
  {
    category: 'Privacy',
    name: 'Healthcare / Medical Data Leak',
    severity: 'High',
    pattern: /\b(diagnosis|patient\s+name|medical\s+record|clinical\s+chart|chemotherapy|cancer|treatment\s+plan)\b/gi,
    recommendation: 'Medical data is highly protected (e.g. HIPAA). Use de-identification and patient consent verification.',
    scoreImpact: 25,
  },

  // 5. Compliance Risk
  {
    category: 'Compliance',
    name: 'GDPR Compliance Alert',
    severity: 'High',
    pattern: /\b(gdpr|eu\s+citizen|data\s+subject|right\s+to\s+be\s+forgotten|consent\s+form|opt-out)\b/gi,
    recommendation: 'GDPR implications detected. Validate user consent and right-to-erase compliance guidelines.',
    scoreImpact: 20,
  },
  {
    category: 'Compliance',
    name: 'Data Retention Risk',
    severity: 'Medium',
    pattern: /\b(store\s+permanently|retain\s+indefinitely|keep\s+logs\s+forever)\b/gi,
    recommendation: 'Ensure your data retention policies comply with statutory limits.',
    scoreImpact: 15,
  },

  // 6. Security Risk
  {
    category: 'Security',
    name: 'SSH Key or Certificate Leak',
    severity: 'Critical',
    pattern: /-----BEGIN[ A-Z]*PRIVATE KEY-----/g,
    recommendation: 'RSA or EC private key exposed. Invalidate and rotate the certificate immediately.',
    scoreImpact: 35,
  },
  {
    category: 'Security',
    name: 'Environment Configuration File Leak',
    severity: 'High',
    pattern: /\b(\.env|docker-compose\.yml|kubeconfig|kubernetes\.yaml)\b/gi,
    recommendation: 'Configuration files expose server deployment infrastructure. Restrict uploading these files.',
    scoreImpact: 25,
  },

  // 7. Toxicity Risk
  {
    category: 'Toxicity',
    name: 'Offensive Language / Swear Words',
    severity: 'Medium',
    pattern: /\b(bastard|bitch|fuck|asshole|shit|dick|cunt)\b/gi,
    recommendation: 'Toxicity flagged. Review content moderation rules to prevent hostile dialog.',
    scoreImpact: 15,
  }
];

export function analyzeGovernance(prompt: string, response: string): GovernanceReport {
  let score = 100;
  const detectedRisks: DetectedRisk[] = [];
  const timestamp = new Date().toISOString();

  // Keep track of counts per category for chart mappings
  const categoryStats: Record<RiskCategory, { count: number; scoreImpact: number }> = {
    'PII': { count: 0, scoreImpact: 0 },
    'Sensitive Info': { count: 0, scoreImpact: 0 },
    'Prompt Injection': { count: 0, scoreImpact: 0 },
    'Privacy': { count: 0, scoreImpact: 0 },
    'Compliance': { count: 0, scoreImpact: 0 },
    'Security': { count: 0, scoreImpact: 0 },
    'Toxicity': { count: 0, scoreImpact: 0 }
  };

  // Track which rules have already deducted score to avoid per-word multi-deduction.
  // Key format: `${ruleIndex}-${location}` — each rule deducts at most ONCE per location.
  const ruleDeducted = new Set<string>();

  const checkText = (text: string, location: 'prompt' | 'response') => {
    if (!text) return;
    
    GOVERNANCE_RULES.forEach((rule, index) => {
      // Reset pattern index
      rule.pattern.lastIndex = 0;
      
      const matches = text.match(rule.pattern);
      if (matches) {
        // Collect unique evidence tokens (de-duplicate case-insensitively)
        const seen = new Set<string>();
        const uniqueMatches = matches.filter(m => {
          const key = m.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        
        uniqueMatches.forEach((match, matchIdx) => {
          const riskId = `${rule.category}-${index}-${location}-${matchIdx}`;
          
          // Check if this exact evidence was already detected for same rule in other location
          const existingRisk = detectedRisks.find(
            r => r.name === rule.name && r.evidence.toLowerCase() === match.toLowerCase()
          );
          
          if (existingRisk) {
            // Evidence found in both locations — update location only, no new deduction
            existingRisk.location = 'both';
          } else {
            detectedRisks.push({
              id: riskId,
              category: rule.category,
              name: rule.name,
              severity: rule.severity,
              evidence: match,
              location: location,
              recommendation: rule.recommendation
            });
            categoryStats[rule.category].count += 1;
          }
        });

        // Deduct score ONCE per rule per location (not once per matched word)
        const deductKey = `${index}-${location}`;
        if (!ruleDeducted.has(deductKey)) {
          ruleDeducted.add(deductKey);
          categoryStats[rule.category].scoreImpact += rule.scoreImpact;
          score -= rule.scoreImpact;
        }
      }
    });
  };

  checkText(prompt, 'prompt');
  checkText(response, 'response');

  // Enforce score bounds [0, 100]
  score = Math.max(0, Math.min(100, score));

  // Determine risk level based on score
  let riskLevel: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
  if (score === 100 && detectedRisks.length === 0) {
    riskLevel = 'Low';
  } else if (score >= 70 && score < 100) {
    riskLevel = 'Medium';
  } else if (score >= 35 && score < 70) {
    riskLevel = 'High';
  } else {
    riskLevel = 'Critical';
  }

  // Force Critical label if any Critical severity risk found, but keep computed score
  const hasCriticalRisk = detectedRisks.some(r => r.severity === 'Critical');
  if (hasCriticalRisk) {
    riskLevel = 'Critical';
    // Ensure score reflects severity but don't clamp to 0 — cap at 35 max for critical
    if (score > 35) {
      score = 35;
    }
  }

  return {
    score,
    riskLevel,
    detectedRisks,
    timestamp,
    promptCharCount: prompt.length,
    responseCharCount: response.length,
    categories: categoryStats
  };
}
