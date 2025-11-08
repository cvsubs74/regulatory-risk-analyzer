# Ontology Overview

This document provides a human-readable overview of the data ontology defined in the seed script.

## Entity Types

These are the core object types in the system.

| Name                 | Description                             | Source Table           |
| -------------------- | --------------------------------------- | ---------------------- |
| Asset                | A system, application, or database.     | `Assets`               |
| ProcessingActivity   | A business process that uses data.      | `ProcessingActivities` |
| DataElement          | A specific category of personal data.   | `DataElements`         |
| DataSubjectType      | A category of individual.               | `DataSubjectTypes`     |
| Vendor               | A third-party company or service.       | `Vendors`              |

## Entity Type Properties

These are the specific attributes defined for certain entity types.

| Belongs to           | Property Name         | Data Type | Required | Description                                                          |
| -------------------- | --------------------- | --------- | -------- | -------------------------------------------------------------------- |
| Asset                | `hosting_location`    | STRING    | Yes      | The physical or cloud region where the asset is hosted.              |
| Asset                | `data_retention_days` | INTEGER   | No       | Number of days data is retained in this asset.                       |
| Vendor               | `contact_email`       | STRING    | Yes      | The primary contact email for the vendor.                            |
| Vendor               | `dpa_signed`          | BOOLEAN   | No       | Indicates if a Data Processing Agreement is signed.                  |
| DataElement          | `sensitivity_level`   | STRING    | Yes      | The sensitivity level of the data (e.g., Public, Confidential, Secret). |

## Data Elements

These are the specific categories of personal data that can be processed.

### Identity and Contact Information

| Name                  | Description                                                              |
| --------------------- | ------------------------------------------------------------------------ |
| Email Address         | User email address used for account identification and communication.    |
| Full Name             | User full name including first and last name.                            |
| Phone Number          | User phone number for account verification and communication.            |
| Home Address          | User physical address for shipping and billing.                          |
| Payment Information   | User payment details including credit card information.                  |
| IP Address            | User IP address collected during system access.                          |
| Device ID             | Unique identifier for user devices accessing the system.                 |
| Username              | Unique identifier chosen by the user for account access.                 |
| Date of Birth         | User date of birth for age verification and demographic analysis.        |
| Social Security Number| Government-issued identification number for tax and identity verification. |
| Passport Number       | Government-issued travel document identifier.                            |
| Driver License Number | Government-issued driving credential identifier.                         |
| National ID           | Country-specific national identification number.                         |
| Biometric Data        | Physical characteristics used for identification (e.g., fingerprints).   |

### Financial Information

| Name                    | Description                                                              |
| ----------------------- | ------------------------------------------------------------------------ |
| Bank Account Number     | User bank account identifier for financial transactions.                 |
| Credit Score            | Numerical representation of creditworthiness.                            |
| Tax Identification Number| Government-issued number for tax reporting purposes.                     |
| Income Information      | Details about user income sources and amounts.                           |
| Transaction History     | Record of financial transactions including purchases and payments.       |
| Investment Information  | Details about user investments, portfolios, and financial assets.        |

### Health Information

| Name                       | Description                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| Medical History            | Record of past medical conditions, treatments, and procedures.                            |
| Prescription Information   | Details about medications prescribed to the user.                                         |
| Insurance Information      | Details about user health insurance coverage and policy.                                  |
| Genetic Data               | Information about genetic characteristics and predispositions.                            |
| Vital Signs                | Measurements of essential body functions like blood pressure, heart rate, and temperature.  |
| Mental Health Information  | Data related to psychological conditions, treatments, and therapy.                        |

### Online Behavior and Technical Data

| Name                 | Description                                                              |
| -------------------- | ------------------------------------------------------------------------ |
| Browsing History     | Record of websites and pages visited by the user.                        |
| Search History       | Record of search queries made by the user.                               |
| Cookies              | Small data files stored on user devices to track browsing activity.      |
| Location Data        | Geographic coordinates or location information of the user.              |
| Device Information   | Details about user hardware, operating system, and browser.              |
| App Usage Data       | Information about how users interact with mobile or web applications.    |

### Professional and Educational Information

| Name                         | Description                                                              |
| ---------------------------- | ------------------------------------------------------------------------ |
| Employment History           | Record of past and current employment positions and employers.           |
| Educational Background       | Information about academic qualifications, institutions, and achievements. |
| Professional Certifications  | Details about professional qualifications and certifications.          |
| Performance Reviews          | Evaluations of work performance and achievements.                        |
| Salary Information           | Details about compensation, benefits, and financial remuneration.      |

### Preference and Behavioral Data

| Name                    | Description                                                              |
| ----------------------- | ------------------------------------------------------------------------ |
| Purchase History        | Record of products and services purchased by the user.                   |
| Product Preferences     | Information about user preferences for specific products or services.    |
| Marketing Preferences   | User choices regarding marketing communications and channels.            |
| Survey Responses        | Information provided by users in surveys and feedback forms.             |
| Social Media Activity   | User interactions, posts, and engagement on social platforms.            |

### Demographic Information

| Name                 | Description                                                        |
| -------------------- | ------------------------------------------------------------------ |
| Gender               | User gender identity information.                                  |
| Age                  | User age information derived from date of birth.                   |
| Ethnicity            | Information about user ethnic background.                          |
| Nationality          | Information about user country of citizenship.                     |
| Religion             | Information about user religious beliefs or affiliations.          |
| Political Opinions   | Information about user political views or affiliations.            |
| Sexual Orientation   | Information about user sexual orientation.                         |
| Marital Status       | Information about user marriage or relationship status.            |
| Family Information   | Details about user family structure, dependents, and relationships.|

## Data Subject Types

These are the different categories of individuals whose data is processed.

| Name             | Description                                                  |
| ---------------- | ------------------------------------------------------------ |
| Customer         | End users who purchase or use our products and services.     |
| Employee         | Internal staff members employed by the company.              |
| Vendor Contact   | Representatives from third-party service providers.          |
| Job Applicant    | Individuals who have applied for employment.                 |
| Business Partner | Organizations or individuals with formal business relationships. |
| Contractor       | External individuals providing services under contract.      |
| Supplier         | Organizations that provide goods or materials.               |
| Prospect                | Potential customers who have shown interest but not yet purchased.   |
| Former Customer         | Individuals who previously purchased but are no longer active.       |
| Subscriber              | Individuals who have registered for recurring services.              |
| Trial User              | Individuals using products or services during a trial period.        |
| Loyalty Program Member  | Customers enrolled in loyalty or rewards programs.                   |
| Executive        | Senior management and leadership team members.         |
| Manager          | Employees with supervisory responsibilities.           |
| Staff            | Regular employees without management responsibilities. |
| Intern           | Temporary employees gaining work experience.           |
| Former Employee  | Individuals who previously worked for the organization.|
| Remote Worker    | Employees who work primarily outside company facilities. |
| Patient                   | Individuals receiving medical care or treatment.                   |
| Healthcare Provider       | Medical professionals providing healthcare services.             |
| Insurance Beneficiary     | Individuals covered by health insurance policies.                |
| Medical Research Subject  | Individuals participating in clinical trials or medical research.  |
| Account Holder   | Individuals with financial accounts at the institution.            |
| Loan Applicant   | Individuals who have applied for credit or loans.                  |
| Borrower         | Individuals who have active loans or credit.                     |
| Investor         | Individuals who have invested funds with the institution.          |
| Guarantor        | Individuals who have guaranteed loans for others.                  |
| Student          | Individuals enrolled in educational programs.                      |
| Parent/Guardian  | Individuals responsible for students under legal age.            |
| Faculty          | Teachers, professors, and instructional staff.                   |
| Alumni           | Former students who have completed educational programs.         |
| Online Shopper   | Individuals who browse or purchase through digital channels.     |
| In-Store Customer| Individuals who shop at physical retail locations.               |
| Gift Recipient   | Individuals who receive products purchased by others.            |
| Website Visitor  | Individuals who browse websites without creating accounts.       |
| App User         | Individuals who use mobile or desktop applications.              |
| Content Creator  | Individuals who generate content on platforms.                   |
| Minor                      | Individuals under the legal age of majority.                     |
| Vulnerable Individual      | Persons requiring special protections due to capacity or circumstances. |
| Authorized Representative  | Individuals legally authorized to act on behalf of others.       |
| Data Subject Representative| Individuals exercising rights on behalf of data subjects.        |

## Relationships

This section defines the valid connections between different entity types.

### Data Subject to Data Element Mappings

This defines which data elements are collected for specific data subject types.

| Data Subject | Data Element        | Description                                                 |
| ------------ | ------------------- | ----------------------------------------------------------- |
| Customer     | Email Address       | Customer email addresses for account access and communications. |
| Customer     | Full Name           | Customer full names for account identification.             |
| Customer     | Phone Number        | Customer phone numbers for account verification and support.  |
| Customer     | Home Address        | Customer addresses for product shipping and billing.        |
| Customer     | Payment Information | Customer payment information for processing transactions.   |
| Employee     | Email Address       | Employee email addresses for work communications.           |
| Employee     | Full Name           | Employee full names for HR records.                         |
| Employee     | Phone Number        | Employee phone numbers for contact purposes.                |
| Employee     | Home Address        | Employee home addresses for HR records.                     |

### Entity Relationships

This defines how different high-level entities are related to each other.

| Source Entity        | Relationship      | Target Entity              | Description                                        |
| -------------------- | ----------------- | -------------------------- | -------------------------------------------------- |
| ProcessingActivity   | USES              | Asset                      | A process uses a system or database.               |
| Asset                | CONTAINS          | DataElement                | A system contains a category of data.              |
| Asset                | TRANSFERS_DATA_TO | Vendor                     | A system sends data to a third-party vendor.       |
| ProcessingActivity   | ASSISTED_BY       | Vendor                     | A business process is assisted by a vendor.        |
| Asset                | CONTAINS          | DataSubjectType            | A system contains data about a type of person.     |
| Asset                | CONTAINS          | DataSubjectTypeElement     | A system contains data about specific types of people. |





