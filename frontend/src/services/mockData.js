// Mock data responses for demo mode

export const MOCK_RESPONSES = {
  'What business processes are documented?': {
    response: `# Business Processes Documented

Based on the documents in our data_v1 corpus, we have the following business processes documented:

## 1. Customer Registration Process
- **Description**: Handles new customer sign-ups and account creation
- **Data Collected**: Name, email, phone number, billing address
- **Storage**: PostgreSQL customer database
- **Retention**: Active accounts indefinitely, deleted accounts purged after 90 days

## 2. Payment Processing
- **Description**: Processes customer payments and transactions
- **Third-Party**: Stripe payment processor
- **Data Shared**: Payment card information (tokenized), transaction amounts
- **Security**: PCI-DSS compliant, end-to-end encryption

## 3. Customer Analytics
- **Description**: Analyzes customer behavior and preferences
- **Data Used**: Purchase history, browsing patterns, demographic information
- **Purpose**: Product recommendations, marketing campaigns
- **Tools**: Google Analytics, internal ML models

## 4. Email Marketing
- **Description**: Sends promotional emails and newsletters
- **Third-Party**: SendGrid
- **Data Shared**: Email addresses, names, purchase history
- **Consent**: Opt-in required, unsubscribe available

## 5. Customer Support
- **Description**: Handles customer inquiries and support tickets
- **Data Accessed**: Account information, order history, communication logs
- **Retention**: Support tickets retained for 3 years

## 6. Data Backup and Recovery
- **Description**: Regular backups of customer data
- **Frequency**: Daily incremental, weekly full backups
- **Storage**: AWS S3 encrypted buckets
- **Retention**: 30 days rolling backup

All processes are documented with data flow diagrams and security controls.`,
    duration: 3000
  },
  
  'Analyze our CCPA compliance risks': {
    response: `# CCPA Compliance Risk Analysis

## Executive Summary
- **Overall Risk Level**: 🟡 **MEDIUM**
- **Critical Issues**: 2
- **Medium Issues**: 5
- **Compliance Score**: 68/100

---

## Critical Risks (Immediate Action Required)

### 1. 🔴 Missing "Do Not Sell" Mechanism
**Regulatory Requirement**: CCPA Section 1798.120 requires businesses to provide a clear "Do Not Sell My Personal Information" link

**Current State**: No visible opt-out mechanism found in documented processes

**Gap**: Website lacks the required "Do Not Sell" link and backend process to honor requests

**Recommendation**: 
- Add prominent "Do Not Sell My Personal Information" link to website footer
- Implement backend flag in customer database to track opt-out status
- Update data sharing agreements with third parties (SendGrid, Google Analytics)
- Timeline: Implement within 30 days

---

### 2. 🔴 Incomplete Data Subject Rights Procedures
**Regulatory Requirement**: CCPA Sections 1798.100-1798.130 require processes for access, deletion, and portability requests

**Current State**: Customer support handles requests ad-hoc, no formal SLA or verification process

**Gap**: 
- No 45-day response timeline tracking
- Insufficient identity verification procedures
- No standardized data export format

**Recommendation**:
- Implement automated DSAR (Data Subject Access Request) portal
- Create identity verification workflow
- Establish 45-day SLA tracking system
- Timeline: Implement within 60 days

---

## Medium Risks (Address Soon)

### 3. 🟡 Third-Party Data Sharing Disclosures
**Requirement**: CCPA Section 1798.115 requires disclosure of categories shared with third parties

**Current State**: Privacy policy mentions Stripe and SendGrid but lacks category details

**Gap**: Need to specify exact data categories shared (e.g., "Identifiers", "Commercial Information")

**Recommendation**: Update privacy policy with CCPA-specific category disclosures

---

### 4. 🟡 Data Retention Policy Documentation
**Requirement**: CCPA Section 1798.105 requires clear retention periods

**Current State**: Some processes have retention periods, others don't

**Gap**: Inconsistent retention documentation across processes

**Recommendation**: Document retention periods for all data categories

---

### 5. 🟡 Consumer Notice at Collection
**Requirement**: CCPA Section 1798.100(b) requires notice of data collection purposes

**Current State**: Registration form has basic privacy notice

**Gap**: Notice doesn't specify all purposes (analytics, marketing)

**Recommendation**: Enhance collection notices with complete purpose list

---

## Recommendations Roadmap

**Immediate (0-30 days)**:
1. Add "Do Not Sell" link and backend mechanism
2. Update privacy policy with third-party category disclosures

**Short-term (1-3 months)**:
1. Implement DSAR portal with identity verification
2. Establish 45-day SLA tracking
3. Document all data retention periods

**Long-term (3-6 months)**:
1. Conduct CCPA compliance audit
2. Train staff on CCPA requirements
3. Implement automated compliance monitoring

---

## Positive Findings ✅

- Strong data security practices (encryption, PCI-DSS compliance)
- Clear data backup and recovery procedures
- Documented data flows for major processes
- Consent mechanisms for email marketing

**Next Steps**: Prioritize critical risks and assign owners for remediation tasks.`,
    duration: 5000
  },

  // Business Data Questions
  'How do we handle customer data in our systems?': {
    response: `# Customer Data Handling

Based on our business process documentation, here's how we handle customer data:

## Data Collection Points

### 1. Customer Registration
- **Data Collected**: Name, email, phone, billing address, password (hashed)
- **Method**: Web form with SSL encryption
- **Validation**: Email verification required
- **Storage**: PostgreSQL database with AES-256 encryption at rest

### 2. Payment Information
- **Data Collected**: Credit card details, billing address
- **Processing**: Stripe payment gateway (PCI-DSS Level 1)
- **Storage**: Tokenized only - no raw card data stored
- **Retention**: Tokens kept for recurring billing, deleted on account closure

### 3. Usage Analytics
- **Data Collected**: Page views, clicks, session duration, device info
- **Tools**: Google Analytics, internal tracking
- **Purpose**: Product improvement, user experience optimization
- **Anonymization**: IP addresses anonymized after 24 hours

## Data Storage Architecture

### Primary Database
- **Type**: PostgreSQL 14
- **Location**: AWS RDS us-east-1
- **Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Backups**: Daily automated, 30-day retention
- **Access Control**: Role-based, MFA required

### File Storage
- **Type**: AWS S3
- **Encryption**: Server-side encryption (SSE-S3)
- **Access**: Pre-signed URLs, time-limited
- **Versioning**: Enabled for audit trail

## Data Access Controls

### Internal Access
- **Principle**: Least privilege
- **Authentication**: SSO with MFA
- **Logging**: All access logged to CloudWatch
- **Review**: Quarterly access audits

### Third-Party Access
- **Vendors**: Stripe (payments), SendGrid (emails), Google Analytics
- **Contracts**: DPAs in place with all vendors
- **Data Shared**: Minimum necessary for service
- **Monitoring**: Monthly vendor compliance reviews

## Data Retention

- **Active Accounts**: Retained indefinitely
- **Inactive Accounts**: Flagged after 2 years, deleted after 3 years
- **Deleted Accounts**: 90-day soft delete, then permanent purge
- **Backups**: 30-day rolling retention
- **Logs**: 1 year retention for security logs

## Security Measures

✅ **Encryption**: At rest and in transit
✅ **Access Control**: RBAC with MFA
✅ **Monitoring**: 24/7 security monitoring
✅ **Incident Response**: Documented procedures
✅ **Penetration Testing**: Annual third-party audits
✅ **Employee Training**: Quarterly security awareness training`,
    duration: 3000
  },

  'What are the data flows for user registration?': {
    response: `# User Registration Data Flow

## Step-by-Step Process

### Step 1: User Initiates Registration
**User Action**: Clicks "Sign Up" button
**Data Entered**: 
- Email address
- Password (min 12 characters)
- Full name
- Phone number (optional)

### Step 2: Client-Side Validation
**Frontend Checks**:
- Email format validation
- Password strength requirements
- Required fields populated
- Terms of service acceptance

### Step 3: Data Transmission
**Protocol**: HTTPS (TLS 1.3)
**Endpoint**: POST /api/v1/auth/register
**Payload**:
\`\`\`json
{
  "email": "user@example.com",
  "password": "hashed_client_side",
  "name": "John Doe",
  "phone": "+1234567890",
  "consent": true
}
\`\`\`

### Step 4: Server-Side Processing
**Backend Actions**:
1. **Validation**: Re-validate all inputs
2. **Duplicate Check**: Query database for existing email
3. **Password Hashing**: bcrypt with salt (cost factor 12)
4. **User Creation**: Insert into users table
5. **Verification Email**: Queue email via SendGrid

**Database Insert**:
\`\`\`sql
INSERT INTO users (
  email, password_hash, name, phone, 
  email_verified, created_at, updated_at
) VALUES (?, ?, ?, ?, false, NOW(), NOW())
\`\`\`

### Step 5: Email Verification
**Email Service**: SendGrid
**Data Shared**: Email address, name, verification token
**Email Content**: 
- Welcome message
- Verification link (expires in 24 hours)
- Privacy policy link

**Verification Token**:
- Generated: Cryptographically secure random string
- Stored: Redis cache with 24-hour TTL
- Format: JWT with user_id and expiration

### Step 6: Account Activation
**User Action**: Clicks verification link
**Backend Process**:
1. Validate token from Redis
2. Update user record: email_verified = true
3. Delete token from Redis
4. Log successful verification
5. Redirect to login page

## Data Storage Locations

| Data Element | Storage Location | Encryption | Retention |
|--------------|-----------------|------------|-----------|
| Email | PostgreSQL users table | AES-256 | Until account deletion |
| Password Hash | PostgreSQL users table | bcrypt | Until account deletion |
| Name | PostgreSQL users table | AES-256 | Until account deletion |
| Phone | PostgreSQL users table | AES-256 | Until account deletion |
| Verification Token | Redis cache | In-memory | 24 hours |
| Registration IP | PostgreSQL audit_log | AES-256 | 90 days |

## Third-Party Data Sharing

### SendGrid (Email Service)
**Data Shared**: Email address, name
**Purpose**: Send verification email
**DPA**: In place
**Retention**: 30 days in SendGrid logs

### Google Analytics
**Data Shared**: Anonymized registration event
**Purpose**: Track conversion rates
**PII**: No PII shared
**Retention**: 26 months

## Security Controls

✅ **Rate Limiting**: Max 5 registration attempts per IP per hour
✅ **CAPTCHA**: reCAPTCHA v3 on registration form
✅ **Email Verification**: Required before account activation
✅ **Password Policy**: Minimum 12 characters, complexity requirements
✅ **Audit Logging**: All registration attempts logged
✅ **Fraud Detection**: IP reputation check, disposable email blocking`,
    duration: 3000
  },

  // Regulations Questions
  'What regulations are available?': {
    response: `# Available Regulations in Corpus

Our regulations corpus currently contains the following privacy and compliance frameworks:

## 1. California Consumer Privacy Act (CCPA)
**Jurisdiction**: California, USA
**Effective Date**: January 1, 2020
**Last Updated**: January 1, 2023 (CPRA amendments)
**Scope**: Businesses collecting California residents' personal information
**Key Requirements**:
- Consumer rights (access, deletion, opt-out)
- "Do Not Sell" mechanism
- Privacy policy disclosures
- Data breach notifications

## 2. General Data Protection Regulation (GDPR)
**Jurisdiction**: European Union
**Effective Date**: May 25, 2018
**Scope**: Processing of EU residents' personal data
**Key Requirements**:
- Lawful basis for processing
- Data subject rights (access, erasure, portability)
- Data protection by design
- DPIA for high-risk processing
- DPO appointment (when required)

## Coverage by Topic

### Data Subject Rights
- ✅ CCPA: Access, deletion, opt-out of sale
- ✅ GDPR: Access, rectification, erasure, portability, restriction

### Consent Requirements
- ✅ CCPA: Opt-out for sale of personal information
- ✅ GDPR: Explicit consent for certain processing

### Data Breach Notification
- ✅ CCPA: Notification requirements
- ✅ GDPR: 72-hour notification to supervisory authority

### Cross-Border Transfers
- ✅ GDPR: Adequacy decisions, SCCs, BCRs
- ⚠️ CCPA: Limited provisions

### Children's Data
- ✅ CCPA: Enhanced protections for under 16
- ✅ GDPR: Enhanced protections for under 16

## How to Query

You can ask specific questions about any regulation:
- "What does CCPA say about consumer rights?"
- "What are GDPR's requirements for consent?"
- "Compare CCPA and GDPR data retention requirements"

**Note**: For regulations not in our corpus, please upload the regulatory text to enable analysis.`,
    duration: 2500
  },

  'What are the data retention requirements under CCPA?': {
    response: `# CCPA Data Retention Requirements

## Overview
The CCPA doesn't prescribe specific retention periods but requires businesses to retain personal information only for as long as necessary for the purposes disclosed.

## Key Provisions

### Section 1798.105 - Right to Deletion
**Requirement**: Businesses must delete consumer personal information upon verified request, **unless** an exception applies.

**Exceptions** (Business may retain data if necessary for):
1. **Complete Transaction**: Fulfill the transaction, provide goods/services, or perform contract
2. **Security**: Detect security incidents, protect against malicious activity
3. **Debugging**: Debug to identify and repair errors
4. **Free Speech**: Exercise free speech rights
5. **Compliance**: Comply with California Electronic Communications Privacy Act
6. **Research**: Conduct public or peer-reviewed scientific research
7. **Internal Use**: Use internally in lawful manner consistent with consumer expectations
8. **Legal Obligations**: Comply with legal obligations
9. **Other Lawful Uses**: Use internally in compatible manner with context provided

### Section 1798.100(b) - Notice at Collection
**Requirement**: Inform consumers of retention periods or criteria for determining retention

**Best Practice**: 
\`\`\`
"We retain your personal information for:
- Active accounts: Duration of account plus 90 days
- Deleted accounts: 90-day soft delete period
- Transaction records: 7 years (tax compliance)
- Marketing data: Until opt-out or 3 years of inactivity"
\`\`\`

## Practical Retention Guidance

### Customer Account Data
- **Active Accounts**: Retain while account is active
- **Inactive Accounts**: Review after 2-3 years of inactivity
- **Deleted Accounts**: 90-day soft delete, then permanent deletion
- **Exception**: Transaction records for tax/legal compliance (7 years)

### Marketing Data
- **Email Lists**: Until opt-out or 3 years of no engagement
- **Analytics**: Aggregate data indefinitely, PII deleted after 26 months
- **Cookies**: Session cookies deleted on close, persistent max 13 months

### Transaction Records
- **Purchase History**: 7 years (tax compliance)
- **Payment Information**: Tokenized data until account closure
- **Invoices**: 7 years (legal requirement)

### Support Data
- **Support Tickets**: 3 years from resolution
- **Chat Logs**: 1 year
- **Call Recordings**: 90 days (unless dispute)

### Security Logs
- **Access Logs**: 1 year
- **Security Incident Logs**: 7 years
- **Audit Trails**: 3 years

## Deletion Request Handling

When consumer requests deletion under CCPA §1798.105:

1. **Verify Identity**: Use same or greater level of verification as account access
2. **Check Exceptions**: Determine if any retention exceptions apply
3. **Delete Data**: Remove from active systems within 45 days
4. **Notify Service Providers**: Instruct them to delete consumer data
5. **Confirm**: Notify consumer of deletion completion
6. **Log**: Maintain record of deletion request (anonymized)

## Documentation Requirements

✅ **Retention Schedule**: Document retention periods for each data category
✅ **Legal Basis**: Identify exception or business need for retention
✅ **Review Process**: Periodic review of retained data
✅ **Deletion Procedures**: Documented process for secure deletion
✅ **Audit Trail**: Log of deletion requests and actions taken

## Recommendations

1. **Create Retention Policy**: Document specific retention periods
2. **Implement Auto-Deletion**: Automated deletion after retention period
3. **Regular Audits**: Quarterly review of retained data
4. **Train Staff**: Ensure team understands retention requirements
5. **Update Privacy Policy**: Clearly communicate retention periods to consumers`,
    duration: 3000
  },

  // Ontology Questions
  'What entity types are defined?': {
    response: `# Defined Entity Types

Our ontology defines the following entity types for data classification and governance:

## Core Entities

### 1. Person
**Description**: Individual human beings (customers, employees, contacts)
**Attributes**:
- \`person_id\` (UUID, required)
- \`name\` (string, required)
- \`email\` (string, required, unique)
- \`phone\` (string, optional)
- \`date_of_birth\` (date, optional)
- \`address\` (Address entity, optional)
- \`classification\` (enum: customer, employee, contact)

**Relationships**:
- Has many \`Orders\`
- Has many \`SupportTickets\`
- Belongs to \`Organization\` (if employee)

### 2. Organization
**Description**: Business entities, companies, partners
**Attributes**:
- \`org_id\` (UUID, required)
- \`name\` (string, required)
- \`tax_id\` (string, optional)
- \`industry\` (string, optional)
- \`address\` (Address entity, required)
- \`type\` (enum: customer, vendor, partner)

**Relationships**:
- Has many \`Persons\` (employees)
- Has many \`Contracts\`
- Has many \`Transactions\`

### 3. Transaction
**Description**: Financial transactions, purchases, payments
**Attributes**:
- \`transaction_id\` (UUID, required)
- \`amount\` (decimal, required)
- \`currency\` (string, required)
- \`timestamp\` (datetime, required)
- \`status\` (enum: pending, completed, failed)
- \`payment_method\` (PaymentMethod entity)

**Relationships**:
- Belongs to \`Person\` or \`Organization\`
- Has one \`Order\`
- Has many \`TransactionItems\`

### 4. DataAsset
**Description**: Data files, databases, datasets
**Attributes**:
- \`asset_id\` (UUID, required)
- \`name\` (string, required)
- \`type\` (enum: database, file, api, stream)
- \`classification\` (DataClassification, required)
- \`location\` (string, required)
- \`owner\` (Person entity, required)
- \`encryption_status\` (boolean, required)

**Relationships**:
- Contains many \`DataElements\`
- Owned by \`Person\`
- Governed by \`DataPolicy\`

### 5. DataElement
**Description**: Individual data fields or columns
**Attributes**:
- \`element_id\` (UUID, required)
- \`name\` (string, required)
- \`data_type\` (enum: string, number, date, boolean)
- \`sensitivity\` (enum: public, internal, confidential, restricted)
- \`pii_flag\` (boolean, required)
- \`encryption_required\` (boolean, required)

**Relationships**:
- Belongs to \`DataAsset\`
- Classified by \`DataClassification\`
- Subject to \`DataPolicy\`

## Specialized Entities

### 6. ProcessingActivity
**Description**: Data processing operations
**Attributes**:
- \`activity_id\` (UUID, required)
- \`name\` (string, required)
- \`purpose\` (string, required)
- \`legal_basis\` (enum: consent, contract, legal_obligation, legitimate_interest)
- \`data_categories\` (array of DataClassification)
- \`retention_period\` (string, required)

**Relationships**:
- Processes \`DataElements\`
- Involves \`ThirdParty\` (optional)
- Governed by \`Regulation\`

### 7. ThirdParty
**Description**: External vendors, processors, partners
**Attributes**:
- \`party_id\` (UUID, required)
- \`name\` (string, required)
- \`role\` (enum: processor, controller, joint_controller)
- \`dpa_status\` (boolean, required)
- \`location\` (string, required)

**Relationships**:
- Receives \`DataElements\`
- Bound by \`Contract\`
- Subject to \`Regulation\`

### 8. Consent
**Description**: User consent records
**Attributes**:
- \`consent_id\` (UUID, required)
- \`person_id\` (UUID, required)
- \`purpose\` (string, required)
- \`granted_date\` (datetime, required)
- \`expiry_date\` (datetime, optional)
- \`withdrawn\` (boolean, default: false)
- \`method\` (enum: explicit, implicit, opt_in, opt_out)

**Relationships**:
- Belongs to \`Person\`
- Authorizes \`ProcessingActivity\`

## Data Classifications

### Sensitivity Levels
1. **Public**: Publicly available information
2. **Internal**: Internal use only
3. **Confidential**: Restricted access
4. **Restricted**: Highly sensitive, minimal access

### PII Categories
- **Direct Identifiers**: Name, email, SSN, phone
- **Indirect Identifiers**: IP address, device ID, cookies
- **Sensitive PII**: Health data, financial data, biometrics
- **Special Categories**: Race, religion, political opinions (GDPR Art. 9)

## Usage

These entity types are used for:
- ✅ Data inventory and mapping
- ✅ Privacy impact assessments
- ✅ Compliance reporting
- ✅ Data lineage tracking
- ✅ Access control policies
- ✅ Retention management`,
    duration: 3000
  }
};

export const getMockResponse = (query) => {
  // Find exact match first
  if (MOCK_RESPONSES[query]) {
    return MOCK_RESPONSES[query];
  }
  
  // Find partial match
  const queryLower = query.toLowerCase();
  for (const [key, value] of Object.entries(MOCK_RESPONSES)) {
    if (queryLower.includes(key.toLowerCase()) || key.toLowerCase().includes(queryLower)) {
      return value;
    }
  }
  
  // Default response
  return {
    response: `I understand you're asking about: "${query}"\n\nIn demo mode, I have mock responses for:\n- "What business processes are documented?"\n- "Analyze our CCPA compliance risks"\n\nPlease try one of these queries, or switch to LIVE MODE to ask any question!`,
    duration: 2000
  };
};
