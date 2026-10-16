import type { LawEntry } from '../types.ts';

export const LAWS_DATA: LawEntry[] = [
  {
    id: 'recruit_4_3',
    name: 'Fair Hiring Procedure Act, Article 4-3',
    shortName: 'Fair Hiring Act Art. 4-3',
    article: 'Article 4-3 (Prohibition of Demand for Personal Information)',
    summary:
      'Prohibits employers from demanding or collecting job-irrelevant physical conditions (appearance, height, weight), region of origin, marital status, personal assets, or family members’ education, occupation, and assets in basic screening documents (기초심사자료). Directly regulates basic screening documents at workplaces with 30+ employees (상시 30인 이상 사업장, e.g. FP-Works with 180 employees); asking such questions orally in an interview carries potential compliance risk under the statutory intent (면접 구두 질문은 법 취지상 위반 소지 및 제한 권고).',
    fullText:
      'Fair Hiring Procedure Act, Article 4-3 (Prohibition of Demanding Personal Information such as Region of Origin): An employer shall not demand a job seeker to state the following information in basic screening documents (기초심사자료) or collect it as supporting materials, unless necessary for performing the relevant job: 1. Physical conditions of the job seeker such as appearance, height, and weight; region of origin, marital status, or assets; 2. Education, occupation, or assets of lineal ascendants, descendants, or siblings of the job seeker. (Applies to workplaces with 30 or more regular employees pursuant to Article 3. Oral interview questions carry potential legal risk and restriction recommendation under the statutory intent.)',
  },
  {
    id: 'gender_7',
    name: 'Equal Employment Opportunity and Work-Family Balance Assistance Act, Article 7',
    shortName: 'Equal Employment Act Art. 7',
    article: 'Article 7 (Recruitment and Hiring)',
    summary:
      'Prohibits gender discrimination in recruitment and hiring. Employers must not present or demand physical conditions (appearance, height, weight) or unmarried status not required for the job. Statutory subject is all workers (근로자, not limited to female workers).',
    fullText:
      'Equal Employment Opportunity and Work-Family Balance Assistance Act, Article 7 (Recruitment and Hiring): (1) An employer shall not discriminate against men or women in recruiting or hiring workers. (2) In recruiting and hiring workers (applicable to all workers, not limited to female workers), an employer shall not present or demand physical conditions such as appearance, height, and weight, unmarried conditions, or any other conditions prescribed by Ordinance of the Ministry of Employment and Labor, which are not required for performing the job.',
  },
  {
    id: 'age_4_4',
    name: 'Age Discrimination in Employment Act, Article 4-4',
    shortName: 'Age Discrimination Act Art. 4-4',
    article: 'Article 4-4 (Prohibition of Age Discrimination in Recruitment & Hiring)',
    summary:
      'Prohibits employers from discriminating against job seekers on the basis of age without justifiable reason in recruitment and hiring, or presuming hierarchy/adaptability issues based on age.',
    fullText:
      'An employer shall not discriminate against workers or persons who wish to become workers on the grounds of age without justifiable reason in any of the following areas: 1. Recruitment and hiring; 2. Wage, payment of money and valuables other than wage, and welfare benefits; 3. Education and training; 4. Placement, transfer, and promotion; 5. Retirement and dismissal.',
  },
  {
    id: 'nhrc_2_3',
    name: 'National Human Rights Commission Act, Article 2(3)',
    shortName: 'NHRC Act Art. 2(3)',
    article: 'Article 2 Subparagraph 3 (Discriminatory Act Violating the Right to Equality)',
    summary:
      'Defines any act of favorably treating, excluding, differentiating, or unfavorably treating a person in employment (including recruitment and hiring) without reasonable grounds based on gender, religion, age, region of origin, physical condition, marital status, pregnancy/childbirth, or family form as a discriminatory act.',
    fullText:
      'The term "discriminatory act violating the right to equality" means any act of favorably treating, excluding, differentiating, or unfavorably treating a particular person in employment without reasonable grounds on the basis of gender, religion, disability, age, social status, region of origin, physical conditions such as appearance, marital status, pregnancy or childbirth, family form or situation, or political opinion.',
  },
];

export const LAW_MAP: Record<string, LawEntry> = Object.fromEntries(
  LAWS_DATA.map((law) => [law.id, law])
);
