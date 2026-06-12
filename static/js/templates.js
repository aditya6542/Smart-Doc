// Professional Template Registry for Smart Document Studio

export const TEMPLATE_CATEGORIES = [
  { id: 'academic', name: 'Academic', icon: 'graduation-cap' },
  { id: 'business', name: 'Business', icon: 'briefcase' },
  { id: 'resume', name: 'Resume', icon: 'user' },
  { id: 'personal', name: 'Personal', icon: 'heart' },
  { id: 'legal', name: 'Legal', icon: 'shield-alert' },
  { id: 'notes', name: 'Notes', icon: 'pencil' }
];

export const TEMPLATES = [
  // --- ACADEMIC ---
  {
    id: 'acad-assignment',
    name: 'Assignment Cover & Body',
    category: 'academic',
    description: 'Standard assignment layout with course info, code blocks, and references.',
    theme: 'academic',
    styles: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: '1in', bottom: '1in', left: '1in', right: '1in' },
      themeColor: '#3b82f6',
      lineSpacing: '2',
      fontFamily: 'Lora',
      headerText: 'Course Assignment Submission',
      footerText: 'Department of Computer Science',
      pageNumbers: true
    },
    content: `
      <h1 style="text-align: center; margin-top: 2in;">Design of Decentralized Storage Architectures</h1>
      <p style="text-align: center; font-size: 14px; margin-bottom: 2in;">
        <strong>Course:</strong> CS-402 Distributed Systems<br>
        <strong>Instructor:</strong> Prof. Evelyn Hargreaves<br>
        <strong>Student:</strong> Alex Mercer (ID: 940294)<br>
        <strong>Date:</strong> October 24, 2026
      </p>
      <hr>
      <h2>1. Introduction</h2>
      <p>Decentralized storage networks utilize peer-to-peer configurations to store files across multiple nodes. Unlike centralized cloud arrays, this paradigm alleviates single points of failure and enhances data privacy through automated client-side cryptographic hashing.</p>
      <blockquote>
        "The shift from centralized hosting models to peer-to-peer addressable block networks marks the third major epoch in global network design."
      </blockquote>
      <h2>2. Experimental Architecture</h2>
      <p>We implemented a prototype client-server topology using simulated latency vectors. Below is the primary hashing routing algorithm employed in our script:</p>
      <pre><code>def get_consistent_hash(node_key: str, data_block: bytes) -> int:
    # Generates uniform ring placement for data chunks
    combined = node_key.encode() + data_block
    return hashlib.sha256(combined).digest() % 360</code></pre>
      <h2>3. Performance Evaluation</h2>
      <p>Data lookup speeds were analyzed under variable network size profiles. The results are summarized in the table below:</p>
      <table>
        <thead>
          <tr>
            <th>Active Nodes</th>
            <th>Average Latency (ms)</th>
            <th>Throughput (MB/s)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>10</td>
            <td>45.2</td>
            <td>120.4</td>
          </tr>
          <tr>
            <td>100</td>
            <td>62.8</td>
            <td>112.9</td>
          </tr>
          <tr>
            <td>1000</td>
            <td>118.1</td>
            <td>94.2</td>
          </tr>
        </tbody>
      </table>
      <h2>4. References</h2>
      <ol>
        <li>Berners-Lee, T. (2020). <em>Decentralized Architecture on the Web</em>. Oxford University Press.</li>
        <li>Nakamoto, S. (2008). <em>Bitcoin: A Peer-to-Peer Electronic Cash System</em>.</li>
      </ol>
    `
  },
  {
    id: 'acad-research',
    name: 'Research Paper Layout',
    category: 'academic',
    description: 'Double column feel, abstract block, formatted citations, and references.',
    theme: 'academic',
    styles: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: '1in', bottom: '1in', left: '1in', right: '1in' },
      themeColor: '#1e3a8a',
      lineSpacing: '1.5',
      fontFamily: 'Lora',
      headerText: 'IEEE Transactions on Machine Intelligence',
      footerText: 'Preprint - Under Review',
      pageNumbers: true
    },
    content: `
      <h1 style="text-align: center;">Gradient-Guided Semantic Mapping in Autonomous Agents</h1>
      <p style="text-align: center; font-size: 12px; margin-bottom: 20px;">
        <strong>Dr. Sarah Jenkins</strong>, Institute of Robotics, Stanford University<br>
        <strong>Dr. Rayan Khas</strong>, Faculty of Automation, MIT
      </p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; margin-bottom: 30px; border-radius: 8px;">
        <h3 style="margin-top: 0; text-align: center;">Abstract</h3>
        <p style="font-size: 13px; font-style: italic; margin-bottom: 0;">This paper presents a novel approach to spatial semantic mapping utilizing gradient-guided optimization vectors. By mapping neural scene approximations directly to local geometric coordinate matrices, our robot completes mapping 40% faster under heavy clutter. We validate our model in simulated residential environments.</p>
      </div>
      <h2>1. Introduction</h2>
      <p>Semantic scene modeling is a critical bottleneck for navigation. Traditional LIDAR grids excel at geometry but lack semantic context, requiring auxiliary deep neural net sweeps that induce massive latency [1].</p>
      <h2>2. Methodology</h2>
      <p>Our method introduces a unified scene parsing vector. The pipeline is summarized in the following stages:</p>
      <ul>
        <li><strong>Vector Extraction:</strong> Feature capture via local monocular cameras.</li>
        <li><strong>Gradient Alignment:</strong> Fitting projections against geometric constraints.</li>
        <li><strong>Continuous Update:</strong> Running recursive loops to minimize estimation drift.</li>
      </ul>
      <p>We detail the model's error metrics across three baseline testing arenas in the table below:</p>
      <table>
        <thead>
          <tr>
            <th>Simulation Arena</th>
            <th>Baseline Drift</th>
            <th>Proposed Drift</th>
            <th>Error Delta</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Indoor Lounge</td>
            <td>0.12m</td>
            <td>0.03m</td>
            <td>-75%</td>
          </tr>
          <tr>
            <td>Lab Warehouse</td>
            <td>0.34m</td>
            <td>0.09m</td>
            <td>-73.5%</td>
          </tr>
          <tr>
            <td>Open Park</td>
            <td>0.56m</td>
            <td>0.22m</td>
            <td>-60.7%</td>
          </tr>
        </tbody>
      </table>
      <h2>3. Discussion & References</h2>
      <p>The results demonstrate that consolidating scene parsing with geometric filters reduces processing loops. Future studies will extend this to multi-agent configurations.</p>
      <hr>
      <p style="font-size: 11px;">
        [1] Smith, J., & Doe, A. (2024). <em>Real-Time Semantic Mapping</em>. Robotics Letters, 12(3), 145-152.<br>
        [2] Jenkins, S. (2025). <em>Spatial Optimization Vectors</em>. Journal of AI Systems, 8, 89-101.
      </p>
    `
  },

  // --- BUSINESS ---
  {
    id: 'biz-proposal',
    name: 'Project Proposal Theme',
    category: 'business',
    description: 'Corporate colors, structured pricing tables, deliverables checklist, and sign-off block.',
    theme: 'business',
    styles: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: '1in', bottom: '1in', left: '1in', right: '1in' },
      themeColor: '#2563eb',
      lineSpacing: '1.5',
      fontFamily: 'Outfit',
      headerText: 'Business Proposal - Smart Document Studio',
      footerText: 'Confidential - Prepared for Acme Corp',
      pageNumbers: true
    },
    content: `
      <h1 style="color: #1d4ed8; font-size: 32px; margin-top: 1in;">Enterprise Document Automation Solution</h1>
      <p style="font-size: 14px; color: #475569; margin-bottom: 2in;">
        <strong>Prepared For:</strong> Acme Corporation Inc.<br>
        <strong>Prepared By:</strong> Smart Document Studio Sales Team<br>
        <strong>Status:</strong> Draft Proposal V1.2<br>
        <strong>Date:</strong> June 12, 2026
      </p>
      <hr style="border-top: 2px solid #2563eb;">
      <h2>1. Executive Summary</h2>
      <p>Acme Corp currently manages document editing through disparate legacy software suites, generating inconsistencies in brand layout and high export overhead. We propose installing the Enterprise version of <strong>Smart Document Studio</strong> to unify document drafting, templates governance, and automatic PDF/Word generation under a centralized secure system.</p>
      <h2>2. Core Deliverables</h2>
      <p>We will configure and deploy custom features tailored to Acme's security framework:</p>
      <ul data-type="taskList">
        <li><label><input type="checkbox" checked></label><div>Centralized CSS Template Branding System</div></li>
        <li><label><input type="checkbox" checked></label><div>Single Sign-On (SSO) Okta Integration</div></li>
        <li><label><input type="checkbox"></label><div>Dedicated High-Performance Python API Microservice</div></li>
        <li><label><input type="checkbox"></label><div>Offline LocalStorage Browser Encryption Layer</div></li>
      </ul>
      <h2>3. Financial Projection</h2>
      <p>The implementation phase and licensing structure are estimated below:</p>
      <table>
        <thead>
          <tr>
            <th>Scope Item</th>
            <th>Labor Estimate</th>
            <th>Cost (USD)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>SSO & Setup</td>
            <td>15 Hours</td>
            <td>$2,250</td>
          </tr>
          <tr>
            <td>Custom Template Designing</td>
            <td>10 Hours</td>
            <td>$1,500</td>
          </tr>
          <tr>
            <td>Yearly Server License (100 Users)</td>
            <td>Recurring</td>
            <td>$9,600</td>
          </tr>
          <tr>
            <td><strong>Total Investment</strong></td>
            <td>-</td>
            <td><strong>$13,350</strong></td>
          </tr>
        </tbody>
      </table>
      <h2>4. Approvals</h2>
      <p>This proposal is valid for 30 days. Signatures below authorize initiation of scoping.</p>
      <div style="display: flex; justify-content: space-between; margin-top: 50px;">
        <div style="width: 200px; border-top: 1px solid #94a3b8; text-align: center; padding-top: 5px; font-size: 12px;">
          Acme Corp Representative
        </div>
        <div style="width: 200px; border-top: 1px solid #94a3b8; text-align: center; padding-top: 5px; font-size: 12px;">
          Smart Doc Studio Manager
        </div>
      </div>
    `
  },
  {
    id: 'biz-invoice',
    name: 'Corporate Invoice',
    category: 'business',
    description: 'Clean invoice layout with table, total summation fields, and metadata.',
    theme: 'business',
    styles: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: '0.8in', bottom: '0.8in', left: '0.8in', right: '0.8in' },
      themeColor: '#0f172a',
      lineSpacing: '1.15',
      fontFamily: 'Outfit',
      headerText: 'INVOICE - Smart Document Studio',
      footerText: 'Thank you for your business!',
      pageNumbers: false
    },
    content: `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
        <div>
          <h1 style="font-size: 28px; margin: 0; color: #0f172a;">Smart Doc Studio LLC</h1>
          <p style="font-size: 12px; color: #64748b; margin-top: 5px;">100 Silicon Way, Suite 404<br>San Francisco, CA 94107<br>billing@smartdoc.studio</p>
        </div>
        <div style="text-align: right;">
          <h2 style="font-size: 24px; color: #3b82f6; margin: 0;">INVOICE</h2>
          <p style="font-size: 12px; color: #64748b; margin-top: 5px;">
            <strong>Invoice #:</strong> SDS-2026-0042<br>
            <strong>Date:</strong> June 12, 2026<br>
            <strong>Due Date:</strong> July 12, 2026
          </p>
        </div>
      </div>
      <hr style="margin-bottom: 20px; border-top: 1px solid #cbd5e1;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div>
          <h4 style="font-size: 11px; text-transform: uppercase; color: #94a3b8; margin-bottom: 5px;">Bill To:</h4>
          <p style="font-size: 12px; font-weight: bold; margin: 0;">Initech Technologies Inc.</p>
          <p style="font-size: 12px; color: #64748b; margin-top: 2px;">Attn: Accounts Payable<br>1200 Office Park Loop<br>Austin, TX 78759</p>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Enterprise Cloud Subscription (1 Month Trial Access)</td>
            <td>1</td>
            <td>$0.00</td>
            <td>$0.00</td>
          </tr>
          <tr>
            <td>Tailored Integration Consulting & Layout Templating</td>
            <td>12 Hours</td>
            <td>$150.00</td>
            <td>$1,800.00</td>
          </tr>
          <tr>
            <td>Dedicated On-Premise Python Microservice License</td>
            <td>1</td>
            <td>$1,200.00</td>
            <td>$1,200.00</td>
          </tr>
        </tbody>
      </table>
      <div style="display: flex; justify-content: flex-end; margin-top: 30px;">
        <div style="width: 250px; font-size: 13px;">
          <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f1f5f9;">
            <span>Subtotal:</span>
            <span>$3,000.00</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f1f5f9;">
            <span>Tax (0%):</span>
            <span>$0.00</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; font-weight: bold; font-size: 15px; border-bottom: 2px solid #0f172a;">
            <span>Total Amount Due:</span>
            <span>$3,000.00</span>
          </div>
        </div>
      </div>
      <div style="margin-top: 60px; font-size: 11px; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 15px;">
        Payment terms: net 30 days. Payments can be completed wire transfer to Bank of America Acct: XXXX-XXXX-4920 routing code: XXXX0023. For question regarding invoices, please write billing@smartdoc.studio.
      </div>
    `
  },

  // --- RESUME ---
  {
    id: 'res-modern',
    name: 'Modern Resume',
    category: 'resume',
    description: 'Clean resume format with split contacts section and bulleted work history.',
    theme: 'business',
    styles: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: '0.6in', bottom: '0.6in', left: '0.6in', right: '0.6in' },
      themeColor: '#3b82f6',
      lineSpacing: '1.2',
      fontFamily: 'Inter',
      headerText: '',
      footerText: '',
      pageNumbers: false
    },
    content: `
      <h1 style="font-size: 32px; font-weight: 800; color: #1e293b; margin: 0; text-align: center;">JASON CARTER</h1>
      <p style="text-align: center; font-size: 12px; color: #3b82f6; font-weight: bold; letter-spacing: 1.5px; margin-top: 5px; margin-bottom: 15px;">
        SENIOR SOFTWARE ARCHITECT & FULL-STACK ENGINEER
      </p>
      <p style="text-align: center; font-size: 11px; color: #64748b; margin-bottom: 25px;">
        San Francisco, CA • (555) 019-2834 • jason.carter@email.com • linkedin.com/in/jasoncarter • github.com/jasoncarter
      </p>
      <hr style="border-top: 1px solid #cbd5e1; margin-bottom: 20px;">
      
      <h3 style="color: #3b82f6; font-size: 14px; font-weight: 800; text-transform: uppercase; margin-bottom: 8px;">Professional Summary</h3>
      <p style="font-size: 12px; line-height: 1.5; margin-bottom: 20px;">
        Innovative, result-oriented Software Architect with 8+ years of experience leading multi-functional engineering squads. Proven track record designing cloud-native services, scaling Python microservices frameworks, and launching rich browser interfaces that optimize workflow throughput.
      </p>

      <h3 style="color: #3b82f6; font-size: 14px; font-weight: 800; text-transform: uppercase; margin-bottom: 8px;">Work History</h3>
      
      <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin-bottom: 3px;">
        <span>Senior Staff Architect - CloudTech Labs</span>
        <span>2023 - Present</span>
      </div>
      <p style="font-style: italic; font-size: 11px; color: #64748b; margin-bottom: 8px;">San Francisco, CA</p>
      <ul style="font-size: 12px; line-height: 1.5; margin-bottom: 15px;">
        <li>Led migration of central data pipeline to Python FastAPI, boosting throughput by 32% and decreasing CPU cycles.</li>
        <li>Built cross-browser rich editor widgets utilizing Canvas rendering, supporting 10,000+ active users.</li>
        <li>Instituted comprehensive CI/CD lint and test processes, reducing production deployment faults by 45%.</li>
      </ul>

      <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin-bottom: 3px;">
        <span>Full Stack Developer - Initech Softwares</span>
        <span>2019 - 2023</span>
      </div>
      <p style="font-style: italic; font-size: 11px; color: #64748b; margin-bottom: 8px;">Austin, TX</p>
      <ul style="font-size: 12px; line-height: 1.5; margin-bottom: 20px;">
        <li>Maintained and upgraded legacy Django web APIs, optimizing load speeds for core database lookups.</li>
        <li>Coordinated closely with designers to deploy beautiful responsive layouts built on Tailwind CSS configurations.</li>
      </ul>

      <h3 style="color: #3b82f6; font-size: 14px; font-weight: 800; text-transform: uppercase; margin-bottom: 8px;">Core Skills</h3>
      <p style="font-size: 12px; line-height: 1.5; margin-bottom: 20px;">
        <strong>Languages:</strong> Python, TypeScript, JavaScript, HTML5, CSS3, SQL<br>
        <strong>Frameworks:</strong> FastAPI, Django, Flask, React, Next.js, Tailwind CSS<br>
        <strong>Infrastructure:</strong> Docker, Kubernetes, AWS, PostgreSQL, Redis, Git, CI/CD
      </p>

      <h3 style="color: #3b82f6; font-size: 14px; font-weight: 800; text-transform: uppercase; margin-bottom: 8px;">Education</h3>
      <div style="display: flex; justify-content: space-between; font-size: 12px;">
        <strong>B.S. in Computer Science - University of Texas at Austin</strong>
        <span>Graduated 2019</span>
      </div>
    `
  },

  // --- PERSONAL ---
  {
    id: 'pers-sop',
    name: 'Statement of Purpose (SOP)',
    category: 'personal',
    description: 'Clean personal statement structure with academic typography.',
    theme: 'academic',
    styles: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: '1in', bottom: '1in', left: '1in', right: '1in' },
      themeColor: '#1e293b',
      lineSpacing: '1.5',
      fontFamily: 'Lora',
      headerText: 'Statement of Purpose - M.S. Application',
      footerText: 'Applicant: Jason Carter',
      pageNumbers: true
    },
    content: `
      <h1>Statement of Purpose</h1>
      <p style="font-size: 13px; color: #64748b; margin-bottom: 30px;">
        <strong>Applicant Name:</strong> Jason Carter<br>
        <strong>Program:</strong> Master of Science in Computer Science (Distributed Computing track)<br>
        <strong>Term:</strong> Fall Semester 2026
      </p>
      <p>My fascination with distributed systems began during my sophomore year, when I first encountered the intricacies of maintaining data consistency across nodes that could fail independently. The challenge of engineering systems that are both highly available and consistent under partitions motivated me to focus my undergraduate study on network consensus algorithms.</p>
      <p>Over the past four years as a software engineer at CloudTech Labs, I have applied these theoretical foundations to build production environments. I led the team that redesigned our distributed caching layers, writing our APIs using FastAPI and Pydantic to manage massive load spikes without dropping requests. This experience highlighted the gap between clean theoretical consensus models (like Paxos or Raft) and the complex edge cases generated by hardware latency and thread scheduling in real clusters.</p>
      <p>I wish to join the Graduate Division of computer science at your institution to work with Dr. Evelyn Hargreaves on optimizing consensus latencies in geographical multi-cloud setups. Your university's Laboratory for Distributed Architecture offers the ideal collaborative ecosystem to research next-generation partition resilience.</p>
      <p>Given my academic track record, professional programming maturity, and deep passion for distributed computing, I am confident I will contribute meaningfully to the research output of your laboratory. I thank the admissions committee for their review.</p>
    `
  },

  // --- LEGAL ---
  {
    id: 'legal-nda',
    name: 'Mutual Non-Disclosure Agreement',
    category: 'legal',
    description: 'Formal contract format with capitalized headings and signature sign-off rows.',
    theme: 'legal',
    styles: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: '1in', bottom: '1in', left: '1in', right: '1in' },
      themeColor: '#0f172a',
      lineSpacing: '1.5',
      fontFamily: 'Playfair Display',
      headerText: 'MUTUAL NON-DISCLOSURE AGREEMENT',
      footerText: 'Confidential Document - Page Number:',
      pageNumbers: true
    },
    content: `
      <h1 style="text-align: center;">MUTUAL NON-DISCLOSURE AGREEMENT</h1>
      <p>This Mutual Non-Disclosure Agreement (the "Agreement") is entered into as of <strong>June 12, 2026</strong> (the "Effective Date"), by and between:</p>
      <p><strong>Disclosing Party A:</strong> Smart Document Studio LLC, located at 100 Silicon Way, San Francisco, CA 94107, and</p>
      <p><strong>Disclosing Party B:</strong> Acme Corporation Inc., located at 500 Industrial Parkway, Austin, TX 78701.</p>
      <p>Each party may be referred to individually as a "Party" and collectively as the "Parties."</p>
      <h2>1. PURPOSE</h2>
      <p>The Parties wish to explore a potential business relationship concerning document automation integrations (the "Purpose"). In connection with the Purpose, each Party may disclose to the other Party proprietary technical or business information which the disclosing Party considers confidential.</p>
      <h2>2. CONFIDENTIAL INFORMATION</h2>
      <p>For purposes of this Agreement, "Confidential Information" shall include all information or material that has or could have commercial value in the business in which Disclosing Party is engaged. If Information is in written form, the Disclosing Party shall label the material with the word "Confidential" or similar warning.</p>
      <h2>3. NON-DISCLOSURE OBLIGATIONS</h2>
      <p>Each Party agrees to hold and maintain the Confidential Information of the other in the strictest confidence. The receiving party shall restrict access to Confidential Information to employees who actively require access to execute tasks relative to the Purpose.</p>
      <h2>4. TERM & SIGNATURES</h2>
      <p>The non-disclosure provisions of this Agreement shall survive the termination of this Agreement and Receiving Party's duty to hold Confidential Information in confidence shall remain in effect for a period of five (5) years from the Effective Date.</p>
      <p>IN WITNESS WHEREOF, the Parties have executed this Mutual Non-Disclosure Agreement as of the Effective Date.</p>
      <div style="display: flex; justify-content: space-between; margin-top: 60px;">
        <div style="width: 220px;">
          <p style="font-size: 11px; margin-bottom: 30px;">Smart Document Studio LLC:</p>
          <div style="border-bottom: 1px solid #000000; height: 30px; margin-bottom: 5px;"></div>
          <p style="font-size: 10px; margin: 0;">By: Manager Office</p>
          <p style="font-size: 10px; margin: 0;">Date: June 12, 2026</p>
        </div>
        <div style="width: 220px;">
          <p style="font-size: 11px; margin-bottom: 30px;">Acme Corporation Inc.:</p>
          <div style="border-bottom: 1px solid #000000; height: 30px; margin-bottom: 5px;"></div>
          <p style="font-size: 10px; margin: 0;">By: CEO Office</p>
          <p style="font-size: 10px; margin: 0;">Date: June 12, 2026</p>
        </div>
      </div>
    `
  },

  // --- NOTES ---
  {
    id: 'note-study',
    name: 'Study Notes Guide',
    category: 'notes',
    description: 'Playful font style with highlight markings, checkboxes, and simple layout.',
    theme: 'notes',
    styles: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: '0.8in', bottom: '0.8in', left: '0.8in', right: '0.8in' },
      themeColor: '#f59e0b',
      lineSpacing: '1.5',
      fontFamily: 'Caveat',
      headerText: 'My Lecture Notes - Computer Systems',
      footerText: 'Exam Study Guide 2026',
      pageNumbers: true
    },
    content: `
      <h1>Lecture Notes: Operating Systems Basics</h1>
      <p>Key topics covered in Class 10 (June 2026). Check this before the exam on next Friday!</p>
      
      <h2>1. What is virtual memory?</h2>
      <p>Virtual memory is an abstraction layer that makes it feel like we have a massive pool of RAM, even if the physical chips are tiny. The OS swaps data block pages back and forth from the hard disk (paging files).</p>
      <blockquote>
        Remember: Swapping to disk is extremely slow! Minimize swap thrashing by adjusting page sizing.
      </blockquote>
      
      <h2>2. Key Concepts Checklist</h2>
      <ul data-type="taskList">
        <li><label><input type="checkbox" checked></label><div>Page Faults: triggers an interrupt when RAM doesn't hold the page</div></li>
        <li><label><input type="checkbox" checked></label><div>TLB Cache: hardware lookup index for page translation</div></li>
        <li><label><input type="checkbox"></label><div>LRU Replacement: Least Recently Used eviction algorithm</div></li>
      </ul>

      <h2>3. TLB Cache vs RAM Lookup speeds</h2>
      <p>Quick lookup times compared:</p>
      <table>
        <thead>
          <tr>
            <th>Hardware Layer</th>
            <th>Access Time (ns)</th>
            <th>Cost / MB</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>L1 Cache Register</td>
            <td>0.5 ns</td>
            <td>Very Expensive</td>
          </tr>
          <tr>
            <td>TLB Index</td>
            <td>2.0 ns</td>
            <td>Expensive</td>
          </tr>
          <tr>
            <td>Standard RAM</td>
            <td>60.0 ns</td>
            <td>Moderate</td>
          </tr>
          <tr>
            <td>SSD Page Swap</td>
            <td>50,000.0 ns</td>
            <td>Very Cheap</td>
          </tr>
        </tbody>
      </table>
      <p>Focus on studying the LRU algorithm code exercises tonight!</p>
    `
  },
  {
    id: 'note-python-qa',
    name: 'Python Interview Q&A Sheet',
    category: 'notes',
    description: 'Corporate blue Q&A bars, bullet points, custom code segments, and left-bordered callout note boxes.',
    theme: 'business',
    styles: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: '0.8in', bottom: '0.8in', left: '0.8in', right: '0.8in' },
      themeColor: 'business',
      lineSpacing: '1.35',
      fontFamily: 'Inter',
      headerText: 'Python Interview Prep Q&A',
      footerText: 'Frequently Asked Questions Guide',
      pageNumbers: true
    },
    content: `
      <h1 style="text-align: center; font-size: 30px; font-weight: 800; color: #0f172a; margin-top: 0.5in; margin-bottom: 5px;">■ Python Interview</h1>
      <h1 style="text-align: center; font-size: 30px; font-weight: 800; color: #0f172a; margin-top: 0px; margin-bottom: 15px;">Questions & Answers</h1>
      <p style="text-align: center; font-size: 13px; color: #4b5563; font-weight: 600; margin-bottom: 40px;">Top 15 Frequently Asked Python Interview Questions with Clear, Concise Answers</p>
      <hr>
      
      <div class="qa-question-bar">Q1. What is Python? What are the benefits of using Python?</div>
      <p><strong>Python</strong> is a high-level, general-purpose, interpreted programming language created by <strong>Guido van Rossum</strong> in 1991. It emphasizes code readability and simplicity.</p>
      <p><strong>Benefits:</strong></p>
      <ul>
        <li><strong>Easy to learn & read</strong> — clean, English-like syntax</li>
        <li><strong>Versatile</strong> — used in web dev, data science, AI/ML, automation, scripting</li>
        <li><strong>Large standard library</strong> — 'batteries included' philosophy</li>
        <li><strong>Huge community & ecosystem</strong> — millions of third-party packages (PyPI)</li>
        <li><strong>Cross-platform</strong> — runs on Windows, macOS, Linux</li>
        <li><strong>Rapid prototyping</strong> — fewer lines of code compared to Java/C++</li>
        <li><strong>Dynamically typed</strong> — no need to declare variable types explicitly</li>
      </ul>

      <div class="qa-question-bar">Q2. What is a Dynamically Typed Language?</div>
      <p>In a <strong>dynamically typed language</strong>, variable types are determined <strong>at runtime</strong>, not at compile time. You don't need to declare a variable's type — Python figures it out automatically.</p>
      <pre><code>x = 10  # x is int
x = "hello"  # now x is str - no error!
x = [1, 2, 3]  # now x is list - perfectly valid</code></pre>
      <div class="qa-callout-note">■ The type is bound to the VALUE, not the VARIABLE. Contrast this with Java/C++ where <em>int x = 10;</em> and then <em>x = "hello"</em> causes a compile-time error.</div>

      <div class="qa-question-bar">Q3. What is an Interpreted Language?</div>
      <p>An <strong>interpreted language</strong> executes code <strong>line by line at runtime</strong> using an interpreter, rather than compiling the entire program to machine code beforehand.</p>
      <p><strong>How Python works:</strong></p>
      <ul>
        <li>Source code (.py) ➔ Python Interpreter ➔ Bytecode (.pyc) ➔ PVM (Python Virtual Machine) ➔ Output</li>
      </ul>
      <p><strong>Advantages:</strong> Easier debugging, platform independence, interactive shell (REPL)</p>
    `
  }
];

export function getTemplateById(id) {
  return TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(catId) {
  if (catId === 'all') return TEMPLATES;
  return TEMPLATES.filter(t => t.category === catId);
}
