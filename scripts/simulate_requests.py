import random
import time

import requests

BASE_URL = "http://localhost:8000"

TEMPLATES = {
    "faq_general": [
        {"subject": "Pricing question", "body": "Can you explain your pricing and annual discounts?"},
        {"subject": "Security details", "body": "Do you support SOC2 and encryption?"},
        {"subject": "Trial request", "body": "Is there a free trial and what are limits?"},
        {"subject": "Integrations", "body": "Do you integrate with HubSpot and Slack?"},
        {"subject": "Data export", "body": "How can I export all data if needed?"},
    ],
    "sales": [
        {"subject": "Need enterprise demo", "body": "We have 400 users and need a demo this week."},
        {"subject": "Upgrade plan", "body": "Can we move from Pro to Enterprise next month?"},
        {"subject": "Pricing for scale", "body": "Need pricing for 200 seats and SSO support."},
        {"subject": "POC", "body": "Can we run a pilot immediately with our security team?"},
        {"subject": "ROI discussion", "body": "Looking to reduce manual operations by 40%."},
    ],
    "support_complaint": [
        {"subject": "Billing issue", "body": "I was charged twice this month. Please fix quickly."},
        {"subject": "Bug report", "body": "Dashboard errors when exporting CSV for large datasets."},
        {"subject": "Complaint", "body": "Support response times are too slow for urgent cases."},
        {"subject": "Critical outage", "body": "Our workflow automation stopped processing today."},
        {"subject": "Login issue", "body": "Multiple users cannot log in after SSO change."},
    ],
}


def make_payload():
    group = random.choice(list(TEMPLATES.values()))
    template = random.choice(group)
    n = random.randint(1000, 9999)
    return {
        "sender_name": f"User {n}",
        "sender_email": f"user{n}@example.com",
        "subject": template["subject"],
        "body": template["body"],
        "metadata": {"source": "simulation"},
    }


def main():
    run_ids = []
    for _ in range(20):
        payload = make_payload()
        resp = requests.post(f"{BASE_URL}/api/v1/webhook", json=payload, timeout=20)
        if resp.status_code == 200:
            data = resp.json()
            run_ids.append(data["run_id"])
            print(f"submitted run_id={data['run_id']} status={data['status']}")
        else:
            print("submit failed", resp.status_code, resp.text)
        time.sleep(0.5)

    states = {rid: None for rid in run_ids}
    done = set()
    while len(done) < len(run_ids):
        for rid in run_ids:
            if rid in done:
                continue
            resp = requests.get(f"{BASE_URL}/api/v1/status/{rid}", timeout=20)
            if resp.status_code != 200:
                continue
            data = resp.json()
            states[rid] = data
            if data["status"] in ["completed", "escalated", "error"]:
                done.add(rid)
        time.sleep(2)

    print("\nrun_id | intent | status | lead_tier | escalated")
    for rid in run_ids:
        d = states[rid] or {}
        print(f"{rid} | {d.get('intent')} | {d.get('status')} | {d.get('lead_tier')} | {d.get('escalate')}")


if __name__ == "__main__":
    main()
