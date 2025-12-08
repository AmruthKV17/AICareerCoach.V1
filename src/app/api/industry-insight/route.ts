import { NextResponse } from 'next/server';

export interface IndustryInsightResponse {
  industry: string;
  date: string;
  topSkills: { 
    name: string; 
    demand: number; 
    growth: string; 
    description: string; 
  }[];
  certifications: { 
    name: string; 
    value: number; 
    avgSalaryBoost: string; 
  }[];
  trends: { 
    name: string; 
    impact: number; 
    probability: number; 
    description: string; 
  }[];
  advice: string;
  sources: string[];
  salaryRange: { 
    min: number; 
    max: number; 
    currency: string; 
    experience: string; 
  };
  jobGrowth: { 
    rate: string; 
    outlook: string; 
  };
}

const MOCK_DATA: IndustryInsightResponse = {
  "industry": "Cloud Developer",
  "date": "November 2025",
  "topSkills": [
    { "name": "AWS", "demand": 52, "growth": "20%", "description": "Amazon Web Services remains the leading cloud platform with a vast range of services, crucial for cloud developers." },
    { "name": "Microsoft Azure", "demand": 38, "growth": "18%", "description": "Azure is rapidly growing, with strong enterprise adoption, particularly in hybrid cloud solutions." },
    { "name": "Cloud Security", "demand": 45, "growth": "15%", "description": "As cloud adoption increases, so does the need for robust security protocols and frameworks." },
    { "name": "DevOps Practices", "demand": 40, "growth": "25%", "description": "Integration of development and operations enhances deployment frequency and reliability." },
    { "name": "Containerization (Docker, Kubernetes)", "demand": 35, "growth": "30%", "description": "Container technologies are critical for scalable application deployment and management." },
    { "name": "Serverless Computing", "demand": 30, "growth": "22%", "description": "Serverless architectures like AWS Lambda are increasingly preferred for cost efficiency and scalability." }
  ],
  "certifications": [
    { "name": "AWS Certified Solutions Architect", "value": 90, "avgSalaryBoost": "25%" },
    { "name": "Microsoft Certified: Azure Solutions Architect Expert", "value": 85, "avgSalaryBoost": "20%" },
    { "name": "Google Professional Cloud Architect", "value": 80, "avgSalaryBoost": "22%" }
  ],
  "trends": [
    { "name": "Increased Hybrid Cloud Adoption", "impact": 80, "probability": 75, "description": "Companies are increasingly adopting hybrid models, combining on-premises and cloud resources." },
    { "name": "Focus on Cloud Security", "impact": 70, "probability": 80, "description": "With rising cyber threats, there is a heightened focus on securing cloud environments." },
    { "name": "Shift to AI and Machine Learning in Cloud", "impact": 75, "probability": 70, "description": "Integration of AI capabilities in cloud services is becoming a major trend, enhancing data processing and analytics." }
  ],
  "salaryRange": { "min": 90000, "max": 150000, "currency": "USD", "experience": "Mid" },
  "jobGrowth": { "rate": "20%", "outlook": "positive" },
  "advice": "To enhance your career as a Cloud Developer, focus on obtaining AWS and Azure certifications within the next 6 months. Additionally, gain hands-on experience with containerization technologies like Docker and Kubernetes by working on side projects or contributing to open-source initiatives over the next year.",
  "sources": [
    "Cloud Developer Salary: Jobs, Trends, and Outlook for 2026 - Coursera (2024)",
    "Cloud Engineer Salary Guide 2025: Average Pay, Trends & Top - Refonte Learning (2025)",
    "Best Cloud Certifications to Land a 6-Figure Salary in 2025 - Whizlabs (2024)",
    "Top 15 High-Demand Tech Jobs for 2025: Roles, Skills, and Salaries - Golden IT (2025)",
    "Trending Tech Skills & Certifications Report - Course Report (2025)"
  ]
};

// GET handler for polling status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kickoffId = searchParams.get('kickoffId');

    if (!kickoffId) {
      return NextResponse.json({ error: 'Missing kickoffId' }, { status: 400 });
    }

    const apiKey = process.env.CREW_AI_API_KEY;
    let apiUrl = process.env.CREW_AI_API_URL;

    // Use mock data if API key is missing (for local dev without keys)
    if (!apiKey || !apiUrl) {
       // Simulate a delay and then return mock data
       return NextResponse.json(MOCK_DATA);
    }
    
    // Construct Status URL: 
    // If API_URL ends with /kickoff, we replace it with /status/{id}
    // Expected API_URL format: https://.../kickoff or https://...
    
    let statusUrl = '';
    if (apiUrl.endsWith('/kickoff')) {
        statusUrl = `${apiUrl.replace('/kickoff', '/status')}/${kickoffId}`;
    } else {
        // Fallback: assume apiUrl is base url, append /status/id
        statusUrl = `${apiUrl}/status/${kickoffId}`;
    }

    console.log(`Polling CrewAI status: ${statusUrl}`);

    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
       const errorText = await response.text();
       console.error(`CrewAI Status Check Failed: ${response.status} - ${errorText}`);
       return NextResponse.json({ error: 'Failed to check status' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error polling industry insights:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetRole } = body;

    if (!targetRole) {
      return NextResponse.json(
        { error: 'targetRole is required' },
        { status: 400 }
      );
    }

    // Check for API Key - if missing, use mock data for development
    const apiKey = process.env.CREW_AI_API_KEY4;
    let apiUrl = process.env.CREW_AI_API_URL4;

    console.log("API Key present:", !!apiKey);
    
    // Append /kickoff if not present for the initial call
    let kickoffUrl = apiUrl;
    if (kickoffUrl && !kickoffUrl.endsWith('/kickoff')) {
      kickoffUrl = `${kickoffUrl}/kickoff`;
    }
    
    console.log("Kickoff URL:", kickoffUrl);

    if (!apiKey || !apiUrl) {
      console.warn("Missing CREW_AI_API_KEY or CREW_AI_API_URL, returning mock data.");
      await new Promise(resolve => setTimeout(resolve, 1500));
      return NextResponse.json(MOCK_DATA);
    }

    console.log("Sending request to CrewAI...");
    // Real API Call
    const response = await fetch(kickoffUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        inputs: {
          job_title: targetRole
        }
      }),
    });

    console.log("CrewAI Response Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("CrewAI API Error Body:", errorText);
      throw new Error(`CrewAI API failed with status: ${response.status}`);
    }

    let data = await response.json();
    console.log("CrewAI Initial Data:", JSON.stringify(data).substring(0, 200) + "...");

    // If we get a kickoff_id, we need to poll for the result
    if (data.kickoff_id) {
        console.log(`Received kickoff_id: ${data.kickoff_id}. Starting server-side polling...`);
        const kickoffId = data.kickoff_id;
        
        // Construct Status URL
        let statusUrl = '';
        // If kickoffUrl was constructed by appending /kickoff, we can replace it
        if (kickoffUrl && kickoffUrl.endsWith('/kickoff')) {
            statusUrl = `${kickoffUrl.replace('/kickoff', '/status')}/${kickoffId}`;
        } else {
             // Fallback
             statusUrl = `${process.env.CREW_AI_API_URL}/status/${kickoffId}`;
        }

        const maxAttempts = 30; // 60 seconds (2s interval)
        let attempts = 0;
        let isComplete = false;

        while (attempts < maxAttempts && !isComplete) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s

            try {
                const statusRes = await fetch(statusUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    console.log(`Poll attempt ${attempts}: ${statusData.state || statusData.status}`);

                    if (statusData.state === 'SUCCESS' || statusData.status === 'COMPLETED' || statusData.status === 'SUCCESS') {
                        isComplete = true;
                        data = statusData; // Update data with the final result
                    } else if (statusData.state === 'FAILED' || statusData.status === 'FAILED') {
                         throw new Error('CrewAI job failed');
                    }
                }
            } catch (pollErr) {
                console.warn(`Polling attempt ${attempts} failed:`, pollErr);
            }
        }

        if (!isComplete) {
            throw new Error('Timeout waiting for CrewAI result');
        }
    }
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching industry insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch industry insights' },
      { status: 500 }
    );
  }
}
