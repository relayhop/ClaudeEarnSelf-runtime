import os
import csv

def process_demand_data(file_path):
    with open(file_path, 'r') as file:
        reader = csv.reader(file, delimiter='\t')
        for row in reader:
            # Process each row according to the demand data format
            print(row)

def get_latest_demand_file():
    demand_dir = 'data/demand'
    files = os.listdir(demand_dir)
    files.sort(key=lambda x: os.path.getmtime(os.path.join(demand_dir, x)), reverse=True)
    return os.path.join(demand_dir, files[0])

if __name__ == "__main__":
    latest_file = get_latest_demand_file()
    process_demand_data(latest_file)