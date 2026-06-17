import pandas as pd
from datetime import datetime

def analyze_demand_data(file_path):
    # Load demand data
    demand_data = pd.read_csv(file_path, sep='\t')
    
    # Analyze data for FRESH_LOW_COMP opportunities
    fresh_low_comp_opportunities = demand_data[(demand_data['category'] == 'FRESH_LOW_COMP')]
    
    # Process these opportunities
    for index, opportunity in fresh_low_comp_opportunities.iterrows():
        # Logic to process the opportunity
        print(f"Processing opportunity: {opportunity['url']}")

def main():
    # Logic to determine the latest demand data file
    latest_demand_file = 'data/demand/demand_2026-05-04T20-42-34.tsv'
    analyze_demand_data(latest_demand_file)

if __name__ == "__main__":
    main()