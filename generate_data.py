#!/usr/bin/env python3
"""
Financial Tracker Prototype Data Generator
Generates consistent, realistic expense and income datasets for a specified date range.
"""

import argparse
import datetime
import json
import os
import random
import uuid

def generate_financial_data(start_date, end_date, salary_amount, rent_amount):
    expenses = []
    incomes = []

    # Track date ranges
    current_date = start_date
    delta_day = datetime.timedelta(days=1)

    # State track for periodic occurrences
    last_gas_days = 0

    while current_date <= end_date:
        day_expenses = []
        day_incomes = []

        day_of_month = current_date.day
        day_of_week = current_date.weekday() # 0 = Monday, 5 = Saturday, 6 = Sunday
        date_str = current_date.strftime("%Y-%m-%d")
        iso_str = current_date.strftime("%Y-%m-%dT12:00:00.000Z")

        # ----------------------------------------
        # 1. FIXED SCHEDULED TRANSACTIONS
        # ----------------------------------------

        # Monthly Salary - Paid on the 1st
        if day_of_month == 1:
            day_incomes.append({
                "id": str(uuid.uuid4()),
                "amount": float(salary_amount),
                "date": date_str,
                "tags": ["salary"],
                "description": "Acme Corp Monthly Salary",
                "account": "Checking",
                "verified": True,
                "createdAt": iso_str,
                "updatedAt": iso_str
            })

        # Monthly Rent - Paid on the 1st
        if day_of_month == 1:
            day_expenses.append({
                "id": str(uuid.uuid4()),
                "amount": float(rent_amount),
                "date": date_str,
                "tags": ["rent", "housing"],
                "description": "Apartment Rent Payment",
                "account": "Checking",
                "verified": True,
                "createdAt": iso_str,
                "updatedAt": iso_str
            })

        # Utilities
        if day_of_month == 10: # Electricity
            day_expenses.append({
                "id": str(uuid.uuid4()),
                "amount": round(random.uniform(85.00, 120.00), 2),
                "date": date_str,
                "tags": ["utilities", "electricity"],
                "description": "Power Grid Utility Bill",
                "account": "Checking",
                "verified": True,
                "createdAt": iso_str,
                "updatedAt": iso_str
            })
        if day_of_month == 12: # Water
            day_expenses.append({
                "id": str(uuid.uuid4()),
                "amount": round(random.uniform(30.00, 55.00), 2),
                "date": date_str,
                "tags": ["utilities", "water"],
                "description": "City Water Service Bill",
                "account": "Checking",
                "verified": True,
                "createdAt": iso_str,
                "updatedAt": iso_str
            })
        if day_of_month == 15: # Internet & Phone
            day_expenses.append({
                "id": str(uuid.uuid4()),
                "amount": 65.00,
                "date": date_str,
                "tags": ["utilities", "internet"],
                "description": "Fiber Broadband Internet",
                "account": "Credit card",
                "verified": True,
                "createdAt": iso_str,
                "updatedAt": iso_str
            })
            day_expenses.append({
                "id": str(uuid.uuid4()),
                "amount": 45.00,
                "date": date_str,
                "tags": ["utilities", "phone"],
                "description": "Mobile Network Subscription",
                "account": "Credit card",
                "verified": True,
                "createdAt": iso_str,
                "updatedAt": iso_str
            })

        # Entertainment Subscriptions
        if day_of_month == 20: # Streaming services
            day_expenses.append({
                "id": str(uuid.uuid4()),
                "amount": 15.99,
                "date": date_str,
                "tags": ["entertainment", "streaming"],
                "description": "Netflix Subscription",
                "account": "Credit card",
                "verified": True,
                "createdAt": iso_str,
                "updatedAt": iso_str
            })
            day_expenses.append({
                "id": str(uuid.uuid4()),
                "amount": 10.99,
                "date": date_str,
                "tags": ["entertainment", "streaming"],
                "description": "Spotify Premium Subscription",
                "account": "Credit card",
                "verified": True,
                "createdAt": iso_str,
                "updatedAt": iso_str
            })

        # Weekly Groceries on Saturday
        if day_of_week == 5:
            day_expenses.append({
                "id": str(uuid.uuid4()),
                "amount": round(random.uniform(75.00, 145.00), 2),
                "date": date_str,
                "tags": ["groceries", "food"],
                "description": "Weekly Groceries Shop",
                "account": "Credit card",
                "verified": random.choice([True, True, True, False]), # 75% verified
                "createdAt": iso_str,
                "updatedAt": iso_str
            })

        # ----------------------------------------
        # 2. SEMI-REGULAR / RANDOM TRANSACTIONS
        # ----------------------------------------

        # Transport/Gas: Every 5 to 7 days
        last_gas_days += 1
        if last_gas_days >= random.randint(5, 7):
            day_expenses.append({
                "id": str(uuid.uuid4()),
                "amount": round(random.uniform(35.00, 55.00), 2),
                "date": date_str,
                "tags": ["transport", "gas"],
                "description": "Gas station fuel refill",
                "account": "Credit card",
                "verified": True,
                "createdAt": iso_str,
                "updatedAt": iso_str
            })
            last_gas_days = 0

        # Freelance Income (occasional) - 12% chance on Fridays
        if day_of_week == 4 and random.random() < 0.12:
            day_incomes.append({
                "id": str(uuid.uuid4()),
                "amount": float(random.choice([250, 300, 450, 600])),
                "date": date_str,
                "tags": ["freelance", "work"],
                "description": "Freelance consulting services",
                "account": "Checking",
                "verified": True,
                "createdAt": iso_str,
                "updatedAt": iso_str
            })

        # Occasional Store Refund - 1% chance
        if random.random() < 0.01:
            day_incomes.append({
                "id": str(uuid.uuid4()),
                "amount": round(random.uniform(15.00, 85.00), 2),
                "date": date_str,
                "tags": ["personal", "refund"],
                "description": "Online store refund",
                "account": "Credit card",
                "verified": True,
                "createdAt": iso_str,
                "updatedAt": iso_str
            })

        # ----------------------------------------
        # 3. FILL REMAINING DAILY SLOTS (Capped 0 to 4 total)
        # ----------------------------------------
        total_created = len(day_expenses) + len(day_incomes)
        max_remaining = 4 - total_created

        if max_remaining > 0:
            # Determine how many random expenses to add today
            # We skew towards 0-2 random items
            choices = [0] * 40 + [1] * 35 + [2] * 20 + [3] * 5
            num_to_add = min(random.choice(choices), max_remaining)

            for _ in range(num_to_add):
                # Pick transaction category based on probability
                rand_val = random.random()
                
                if rand_val < 0.65: # Dining out / Coffee
                    is_weekend = day_of_week in [5, 6]
                    amount = round(random.uniform(12.00, 55.00), 2) if is_weekend else round(random.uniform(5.50, 22.00), 2)
                    desc = "Restaurant Dinner" if amount > 25 else random.choice(["Coffee shop purchase", "Lunch sandwich", "Breakfast pastries"])
                    day_expenses.append({
                        "id": str(uuid.uuid4()),
                        "amount": amount,
                        "date": date_str,
                        "tags": ["food", "dining"],
                        "description": desc,
                        "account": random.choice(["Credit card", "Cash"]),
                        "verified": random.choice([True, True, False]),
                        "createdAt": iso_str,
                        "updatedAt": iso_str
                    })
                elif rand_val < 0.90: # Retail Shopping / Pharmacy / Gym
                    amount = round(random.uniform(10.00, 120.00), 2)
                    tag = random.choice([["shopping"], ["personal", "health"]])
                    desc = random.choice(["Clothing Retail Shop", "Pharmacy Medicine", "Supermarket snacks", "Gym membership pass"])
                    day_expenses.append({
                        "id": str(uuid.uuid4()),
                        "amount": amount,
                        "date": date_str,
                        "tags": tag,
                        "description": desc,
                        "account": "Credit card",
                        "verified": random.choice([True, False]),
                        "createdAt": iso_str,
                        "updatedAt": iso_str
                    })
                else: # Entertainment / Cinema
                    amount = round(random.uniform(15.00, 80.00), 2)
                    day_expenses.append({
                        "id": str(uuid.uuid4()),
                        "amount": amount,
                        "date": date_str,
                        "tags": ["entertainment", "personal"],
                        "description": random.choice(["Cinema tickets & popcorn", "Concert entry fee", "Bowling alley game"]),
                        "account": "Credit card",
                        "verified": random.choice([True, False]),
                        "createdAt": iso_str,
                        "updatedAt": iso_str
                    })

        # Append to main lists
        expenses.extend(day_expenses)
        incomes.extend(day_incomes)

        # Go to next day
        current_date += delta_day

    return expenses, incomes


def main():
    parser = argparse.ArgumentParser(description="Generate random, consistent Financial Tracker prototype database.")
    parser.add_argument("--years", type=int, default=3, help="Number of years to generate data for.")
    parser.add_argument("--salary", type=float, default=3200.00, help="Monthly salary amount.")
    parser.add_argument("--rent", type=float, default=1200.00, help="Monthly rent amount.")
    parser.add_argument("--out-expenses", type=str, default="data/expenses_3years.json", help="Path to write expenses JSON.")
    parser.add_argument("--out-incomes", type=str, default="data/incomes_3years.json", help="Path to write incomes JSON.")
    
    args = parser.parse_args()

    # Determine date range
    end_date = datetime.date.today()
    start_date = end_date - datetime.timedelta(days=args.years * 365)

    print(f"[Generator] Range: {start_date} to {end_date} ({args.years} years)")
    print(f"[Generator] Config: Salary=${args.salary:.2f}, Rent=${args.rent:.2f}")

    expenses, incomes = generate_financial_data(start_date, end_date, args.salary, args.rent)

    # Ensure output directories exist
    os.makedirs(os.path.dirname(args.out_expenses), exist_ok=True)
    os.makedirs(os.path.dirname(args.out_incomes), exist_ok=True)

    # Write to files
    with open(args.out_expenses, "w", encoding="utf-8") as f:
        json.dump(expenses, f, indent=2)
    print(f"[Generator] Wrote {len(expenses)} expenses to {args.out_expenses}")

    with open(args.out_incomes, "w", encoding="utf-8") as f:
        json.dump(incomes, f, indent=2)
    print(f"[Generator] Wrote {len(incomes)} incomes to {args.out_incomes}")


if __name__ == "__main__":
    main()
