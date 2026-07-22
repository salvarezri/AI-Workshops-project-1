#!/usr/bin/env python3
"""
Financial Tracker Prototype Data Generator
Generates consistent, realistic expense and income datasets for a specified date range.
Supports English (en) and Spanish (es / COP currency).
"""

import argparse
import datetime
import json
import os
import random
import uuid

def generate_financial_data(start_date, end_date, salary_amount, rent_amount, lang="en"):
    expenses = []
    incomes = []

    current_date = start_date
    delta_day = datetime.timedelta(days=1)
    last_gas_days = 0

    is_es = lang.lower() in ["es", "spanish", "español"]

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
                "tags": ["salario"] if is_es else ["salary"],
                "description": "Salario Mensual Empresa" if is_es else "Acme Corp Monthly Salary",
                "account": "Bancolombia Ahorros" if is_es else "Checking",
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
                "tags": ["arriendo", "vivienda"] if is_es else ["rent", "housing"],
                "description": "Pago de Arriendo Apartamento" if is_es else "Apartment Rent Payment",
                "account": "Bancolombia Ahorros" if is_es else "Checking",
                "verified": True,
                "createdAt": iso_str,
                "updatedAt": iso_str
            })

        # Utilities / Servicios Públicos (50.000 - 150.000 COP in ES)
        if day_of_month == 10: # Electricity
            amt = float(random.randint(65000, 135000)) if is_es else round(random.uniform(85.00, 120.00), 2)
            day_expenses.append({
                "id": str(uuid.uuid4()),
                "amount": amt,
                "date": date_str,
                "tags": ["servicios", "energia"] if is_es else ["utilities", "electricity"],
                "description": "Factura de Energía / Luz" if is_es else "Power Grid Utility Bill",
                "account": "Nequi" if is_es else "Checking",
                "verified": True,
                "createdAt": iso_str,
                "updatedAt": iso_str
            })

        if day_of_month == 12: # Water
            amt = float(random.randint(50000, 95000)) if is_es else round(random.uniform(30.00, 55.00), 2)
            day_expenses.append({
                "id": str(uuid.uuid4()),
                "amount": amt,
                "date": date_str,
                "tags": ["servicios", "agua"] if is_es else ["utilities", "water"],
                "description": "Factura de Agua y Alcantarillado" if is_es else "City Water Service Bill",
                "account": "Nequi" if is_es else "Checking",
                "verified": True,
                "createdAt": iso_str,
                "updatedAt": iso_str
            })

        if day_of_month == 15: # Internet & Phone
            amt_net = float(random.randint(75000, 110000)) if is_es else 65.00
            amt_ph = float(random.randint(45000, 70000)) if is_es else 45.00
            day_expenses.append({
                "id": str(uuid.uuid4()),
                "amount": amt_net,
                "date": date_str,
                "tags": ["servicios", "internet"] if is_es else ["utilities", "internet"],
                "description": "Servicio Internet Hogar Fibra" if is_es else "Fiber Broadband Internet",
                "account": "Tarjeta de crédito" if is_es else "Credit card",
                "verified": True,
                "createdAt": iso_str,
                "updatedAt": iso_str
            })
            day_expenses.append({
                "id": str(uuid.uuid4()),
                "amount": amt_ph,
                "date": date_str,
                "tags": ["servicios", "telefonia"] if is_es else ["utilities", "phone"],
                "description": "Plan Celular Mensual" if is_es else "Mobile Network Subscription",
                "account": "Tarjeta de crédito" if is_es else "Credit card",
                "verified": True,
                "createdAt": iso_str,
                "updatedAt": iso_str
            })

        # Entertainment Subscriptions
        if day_of_month == 20: # Streaming services
            amt_nfx = 44900.0 if is_es else 15.99
            amt_spt = 19900.0 if is_es else 10.99
            day_expenses.append({
                "id": str(uuid.uuid4()),
                "amount": amt_nfx,
                "date": date_str,
                "tags": ["entretenimiento", "streaming"] if is_es else ["entertainment", "streaming"],
                "description": "Suscripción Netflix" if is_es else "Netflix Subscription",
                "account": "Tarjeta de crédito" if is_es else "Credit card",
                "verified": True,
                "createdAt": iso_str,
                "updatedAt": iso_str
            })
            day_expenses.append({
                "id": str(uuid.uuid4()),
                "amount": amt_spt,
                "date": date_str,
                "tags": ["entretenimiento", "streaming"] if is_es else ["entertainment", "streaming"],
                "description": "Suscripción Spotify Premium" if is_es else "Spotify Premium Subscription",
                "account": "Tarjeta de crédito" if is_es else "Credit card",
                "verified": True,
                "createdAt": iso_str,
                "updatedAt": iso_str
            })

        # Weekly Groceries on Saturday
        if day_of_week == 5:
            amt_groc = float(random.randint(180000, 380000)) if is_es else round(random.uniform(75.00, 145.00), 2)
            day_expenses.append({
                "id": str(uuid.uuid4()),
                "amount": amt_groc,
                "date": date_str,
                "tags": ["mercado", "comida"] if is_es else ["groceries", "food"],
                "description": "Mercado Semanal Supermercado" if is_es else "Weekly Groceries Shop",
                "account": "Bancolombia Ahorros" if is_es else "Credit card",
                "verified": True,
                "createdAt": iso_str,
                "updatedAt": iso_str
            })

        # ----------------------------------------
        # 2. SEMI-REGULAR / RANDOM TRANSACTIONS
        # ----------------------------------------

        # Transport/Gas: Every 5 to 7 days
        last_gas_days += 1
        if last_gas_days >= random.randint(5, 7):
            amt_gas = float(random.randint(50000, 95000)) if is_es else round(random.uniform(35.00, 55.00), 2)
            day_expenses.append({
                "id": str(uuid.uuid4()),
                "amount": amt_gas,
                "date": date_str,
                "tags": ["transporte", "gasolina"] if is_es else ["transport", "gas"],
                "description": "Tanquiada de Gasolina / Transporte" if is_es else "Gas station fuel refill",
                "account": "Tarjeta de crédito" if is_es else "Credit card",
                "verified": True,
                "createdAt": iso_str,
                "updatedAt": iso_str
            })
            last_gas_days = 0

        # Freelance Income (occasional) - 12% chance on Fridays (increased +45% then +20% for COP)
        if day_of_week == 4 and random.random() < 0.12:
            amt_free = float(random.choice([600000, 870000, 1320000, 1740000])) if is_es else float(random.choice([250, 300, 450, 600]))
            day_incomes.append({
                "id": str(uuid.uuid4()),
                "amount": amt_free,
                "date": date_str,
                "tags": ["freelance", "trabajo"] if is_es else ["freelance", "work"],
                "description": "Honorarios Proyecto Freelance" if is_es else "Freelance consulting services",
                "account": "Nequi" if is_es else "Checking",
                "verified": True,
                "createdAt": iso_str,
                "updatedAt": iso_str
            })

        # Occasional Store Refund - 1% chance (increased +45% then +20% for COP)
        if random.random() < 0.01:
            amt_ref = float(random.randint(54000, 210000)) if is_es else round(random.uniform(15.00, 85.00), 2)
            day_incomes.append({
                "id": str(uuid.uuid4()),
                "amount": amt_ref,
                "date": date_str,
                "tags": ["personal", "reembolso"] if is_es else ["personal", "refund"],
                "description": "Reembolso compra tienda en línea" if is_es else "Online store refund",
                "account": "Nequi" if is_es else "Credit card",
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
            choices = [0] * 40 + [1] * 35 + [2] * 20 + [3] * 5
            num_to_add = min(random.choice(choices), max_remaining)

            for _ in range(num_to_add):
                rand_val = random.random()
                
                if rand_val < 0.65: # Lunch / Coffee (Lunch between 10.000 and 30.000 COP)
                    if is_es:
                        is_lunch = random.random() < 0.7
                        if is_lunch:
                            amount = float(random.randint(10000, 30000)) # Lunch benchmark 10k-30k COP
                            desc = "Almuerzo Ejecutivo Restaurante"
                            tag = ["comida", "almuerzo"]
                        else:
                            amount = float(random.randint(4000, 12000)) # Coffee / Snack
                            desc = random.choice(["Café y Snack", "Empanada y Gaseosa", "Desayuno Panadería"])
                            tag = ["comida", "cafeteria"]
                        acc = random.choice(["Efectivo", "Nequi"])
                    else:
                        is_weekend = day_of_week in [5, 6]
                        amount = round(random.uniform(12.00, 55.00), 2) if is_weekend else round(random.uniform(5.50, 22.00), 2)
                        desc = "Restaurant Dinner" if amount > 25 else random.choice(["Coffee shop purchase", "Lunch sandwich", "Breakfast pastries"])
                        tag = ["food", "dining"]
                        acc = random.choice(["Credit card", "Cash"])

                    day_expenses.append({
                        "id": str(uuid.uuid4()),
                        "amount": amount,
                        "date": date_str,
                        "tags": tag,
                        "description": desc,
                        "account": acc,
                        "verified": True,
                        "createdAt": iso_str,
                        "updatedAt": iso_str
                    })

                elif rand_val < 0.90: # Retail / Pharmacy / Cellphone (Low-end cellphone 700k - 1.300.000 COP)
                    if is_es:
                        is_cellphone = random.random() < 0.03 # Occasional cellphone purchase
                        if is_cellphone:
                            amount = float(random.randint(700000, 1300000)) # Cellphone benchmark 700k-1.3M COP
                            desc = "Compra Celular Gama Baja"
                            tag = ["compras", "tecnologia"]
                        else:
                            amount = float(random.randint(25000, 180000))
                            desc = random.choice(["Compra Droguería Farmacia", "Tienda de Ropa", "Artículos de Aseo", "Mensualidad Gimnasio"])
                            tag = random.choice([["compras"], ["salud", "personal"]])
                        acc = "Tarjeta de crédito" if amount > 200000 else random.choice(["Nequi", "Efectivo"])
                    else:
                        amount = round(random.uniform(10.00, 120.00), 2)
                        tag = random.choice([["shopping"], ["personal", "health"]])
                        desc = random.choice(["Clothing Retail Shop", "Pharmacy Medicine", "Supermarket snacks", "Gym membership pass"])
                        acc = "Credit card"

                    day_expenses.append({
                        "id": str(uuid.uuid4()),
                        "amount": amount,
                        "date": date_str,
                        "tags": tag,
                        "description": desc,
                        "account": acc,
                        "verified": True,
                        "createdAt": iso_str,
                        "updatedAt": iso_str
                    })

                else: # Entertainment / Cinema
                    if is_es:
                        amount = float(random.randint(30000, 120000))
                        desc = random.choice(["Boletas Cine y Confitería", "Entrada Evento / Boleta", "Salida Fin de Semana", "Juego de Bolos"])
                        tag = ["entretenimiento", "personal"]
                        acc = random.choice(["Tarjeta de crédito", "Efectivo", "Nequi"])
                    else:
                        amount = round(random.uniform(15.00, 80.00), 2)
                        desc = random.choice(["Cinema tickets & popcorn", "Concert entry fee", "Bowling alley game"])
                        tag = ["entertainment", "personal"]
                        acc = "Credit card"

                    day_expenses.append({
                        "id": str(uuid.uuid4()),
                        "amount": amount,
                        "date": date_str,
                        "tags": tag,
                        "description": desc,
                        "account": acc,
                        "verified": True,
                        "createdAt": iso_str,
                        "updatedAt": iso_str
                    })

        expenses.extend(day_expenses)
        incomes.extend(day_incomes)
        current_date += delta_day

    return expenses, incomes


def main():
    parser = argparse.ArgumentParser(description="Generate random, consistent Financial Tracker prototype database.")
    parser.add_argument("--lang", type=str, choices=["en", "es", "spanish"], default="en", help="Language for generated data (en, es).")
    parser.add_argument("--years", type=int, default=3, help="Number of years to generate data for.")
    parser.add_argument("--salary", type=float, default=None, help="Monthly salary amount.")
    parser.add_argument("--rent", type=float, default=None, help="Monthly rent amount.")
    parser.add_argument("--out-expenses", type=str, default=None, help="Path to write expenses JSON.")
    parser.add_argument("--out-incomes", type=str, default=None, help="Path to write incomes JSON.")
    
    args = parser.parse_args()

    is_es = args.lang.lower() in ["es", "spanish", "español"]

    # Assign default benchmark amounts based on language/currency
    if args.salary is None:
        salary_amount = 4350000.0 if is_es else 3200.00
    else:
        salary_amount = args.salary

    if args.rent is None:
        rent_amount = 1400000.0 if is_es else 1200.00
    else:
        rent_amount = args.rent

    lang_suffix = f"_{args.lang.lower()}" if is_es else ""
    if args.out_expenses is None:
        out_expenses = f"data/expenses_{args.years}years{lang_suffix}.json"
    else:
        out_expenses = args.out_expenses

    if args.out_incomes is None:
        out_incomes = f"data/incomes_{args.years}years{lang_suffix}.json"
    else:
        out_incomes = args.out_incomes

    # Determine date range
    end_date = datetime.date.today()
    start_date = end_date - datetime.timedelta(days=args.years * 365)

    currency = "COP" if is_es else "USD"
    print(f"[Generator] Language: {args.lang.upper()} | Range: {start_date} to {end_date} ({args.years} years)")
    print(f"[Generator] Config: Salary={currency} ${salary_amount:,.2f}, Rent={currency} ${rent_amount:,.2f}")

    expenses, incomes = generate_financial_data(start_date, end_date, salary_amount, rent_amount, lang=args.lang)

    # Ensure output directories exist
    os.makedirs(os.path.dirname(out_expenses), exist_ok=True)
    os.makedirs(os.path.dirname(out_incomes), exist_ok=True)

    # Write to files
    with open(out_expenses, "w", encoding="utf-8") as f:
        json.dump(expenses, f, indent=2, ensure_ascii=False)
    print(f"[Generator] Wrote {len(expenses)} expenses to {out_expenses}")

    with open(out_incomes, "w", encoding="utf-8") as f:
        json.dump(incomes, f, indent=2, ensure_ascii=False)
    print(f"[Generator] Wrote {len(incomes)} incomes to {out_incomes}")


if __name__ == "__main__":
    main()
