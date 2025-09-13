#!/usr/bin/env python3
import requests
import json

# Login first
login_response = requests.post(
    "https://erasmus-backend.onrender.com/api/auth/login",
    json={"username": "demo", "password": "Demo123!"}
)

if login_response.status_code != 200:
    print(f"Login failed: {login_response.text}")
    exit(1)

token = login_response.json()["access_token"]
print("✅ Login successful!")

# Create a proposal with pre-filled answers (bypassing AI generation)
proposal_data = {
    "title": "Digital Skills for Rural Communities",
    "project_idea": "This innovative project aims to bridge the digital divide in rural communities by providing comprehensive digital literacy training to adults aged 45 and above. We will establish digital learning hubs in community centers across rural Spain, Germany, and Italy. The curriculum covers essential digital skills including basic computer operations, internet safety, online banking, accessing government services, telehealth consultations, and social media for staying connected with family. Through a train-the-trainer model, we will ensure sustainability by empowering local facilitators who understand the unique needs of their communities. The project will directly impact 500+ adults in the first year, with a multiplier effect reaching thousands more through peer learning networks.",
    "priorities": ["inclusion", "digital", "participation"],
    "target_groups": ["Adults aged 45+ in rural areas", "Unemployed individuals", "Small business owners"],
    "partners": [
        {"name": "TechEd Institute", "type": "University", "country": "Germany", "role": "Curriculum development and research"},
        {"name": "Digital Inclusion Network", "type": "NGO", "country": "Italy", "role": "Community outreach and evaluation"},
        {"name": "Rural Libraries Association", "type": "Public body", "country": "Portugal", "role": "Infrastructure and local engagement"}
    ],
    "duration_months": 24,
    "budget": "250000",
    "answers": {
        "project_summary": "Our Digital Skills for Rural Communities project addresses the critical digital divide affecting rural populations across Europe. Through establishing community-based digital learning hubs and training local facilitators, we will provide sustainable, culturally-relevant digital literacy education to adults aged 45+, enabling them to fully participate in the digital society.",
        "relevance_to_priorities": "This project directly addresses the 'digital transformation' priority by equipping rural adults with essential digital skills. It promotes 'inclusion and diversity' by targeting marginalized rural populations often left behind in digitalization efforts. The project ensures 'civic engagement and participation' by enabling digital access to democratic processes and public services.",
        "needs_analysis": "Research shows that 42% of rural EU citizens lack basic digital skills compared to 25% in urban areas. Our needs assessment identified key barriers: lack of infrastructure, absence of tailored training programs, and limited local support. Rural adults expressed urgent need for practical digital skills training to access essential services, maintain social connections, and improve employment prospects. The COVID-19 pandemic highlighted these gaps when rural populations struggled with digital health services and remote work opportunities.",
        "target_groups_description": "Primary beneficiaries are adults aged 45+ in rural communities with limited or no digital skills. This includes unemployed individuals seeking to improve employability, small business owners needing digital tools for business growth, elderly citizens wanting to maintain independence through digital services, and agricultural workers requiring digital literacy for modern farming technologies.",
        "expected_impact": "The project will directly train 500+ adults in digital skills within 24 months. Expected outcomes include: 80% of participants achieving basic digital competency, 60% regularly using digital government services, 70% reporting improved social connections through digital tools, 40% finding new employment or business opportunities through digital skills. Long-term impact includes creating a sustainable model for rural digital inclusion that can be replicated across Europe.",
        "partnership_quality": "Our consortium brings together complementary expertise: TechEd Institute provides academic rigor and curriculum development experience, Digital Inclusion Network contributes proven community engagement strategies, Rural Libraries Association offers essential infrastructure and local connections. Partners have collaborated on previous EU projects, ensuring smooth coordination. Each partner has dedicated resources and clear responsibilities aligned with their strengths.",
        "project_management": "The project uses a collaborative management structure with clear work packages, milestones, and deliverables. Monthly steering committee meetings ensure coordination. Risk management includes contingency plans for low participation, technology challenges, and COVID-19 disruptions. Quality assurance through regular evaluations and participant feedback. Budget allocated efficiently across partners with 60% for direct training activities, 20% for infrastructure, 20% for management and dissemination."
    },
    "status": "draft"
}

print("\n💾 Saving proposal to database...")
headers = {"Authorization": f"Bearer {token}"}

save_response = requests.post(
    "https://erasmus-backend.onrender.com/api/proposals/",
    headers=headers,
    json=proposal_data
)

if save_response.status_code in [200, 201]:
    result = save_response.json()
    print(f"✅ Proposal saved successfully!")
    print(f"   ID: {result.get('id')}")
    print(f"   Title: {result.get('title')}")
    print(f"   Status: {result.get('status')}")
    print(f"   Created: {result.get('created_at')}")
    print(f"\n📊 You can now view this proposal in the dashboard at:")
    print(f"   https://erasmus-frontend.onrender.com")
else:
    print(f"❌ Failed to save proposal: {save_response.status_code}")
    print(save_response.text[:500])