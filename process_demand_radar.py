import pandas as pd
import os
from datetime import datetime

def process_demand_radar_data(directory_path):
    try:
        # Find the most recent demand data file
        files = os.listdir(directory_path)
        files.sort()
        latest_file = files[-1]
        file_path = os.path.join(directory_path, latest_file)
        
        # Read the TSV file
        data = pd.read_csv(file_path, sep='\t', header=None, names=['priority', 'source', 'weight', 'bounty', 'tags', 'url', 'description'])
        
        # Process the data (e.g., filter high-priority issues)
        high_priority_issues = data[(data['tags'].str.contains('HIGH_PRIORITY')) | (data['description'].str.contains('[HIGH BOUNTY]'))]
        
        # Further processing or analysis can be done here
        print(high_priority_issues)
        
    except Exception as e:
        print(f"Error processing demand radar data: {e}")

# Example usage
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        directory_path = sys.argv[1]
        process_demand_radar_data(directory_path)
    else:
        print("Please provide the directory path as an argument.")