#!/usr/bin/env python3
import os
import re
import json
from datetime import datetime

def load_patterns():
    """Load dwarf_trace specific patterns from configuration"""
    patterns_file = 'data/demand/dwarf_trace_patterns.json'
    if os.path.exists(patterns_file):
        with open(patterns_file, 'r') as f:
            return json.load(f)
    return {
        'keywords': ['dwarf_trace', 'trace frame', 'PEP 626', 'off-by-one'],
        'url_patterns': [r'github\.com/[^/]+/[^/]+/issues/\d+'],
        'title_patterns': [r'\[Bounty\].*dwarf_trace', r'fix\(dwarf_trace\)', r'resolve.*trace.*ceiling']
    }

def process_demand_data():
    """Process demand data for dwarf_trace specific issues"""
    patterns = load_patterns()
    
    # Get latest demand data file
    demand_dir = 'data/demand'
    latest_file = None
    
    if os.path.exists(demand_dir):
        files = [f for f in os.listdir(demand_dir) if f.startswith('demand_') and f.endswith('.tsv')]
        if files:
            latest_file = sorted(files)[-1]
    
    if not latest_file:
        print("No demand data files found")
        return
    
    file_path = os.path.join(demand_dir, latest_file)
    print(f"Processing {file_path}")
    
    # Process the file
    processed_rows = []
    dwarf_trace_issues = []
    
    with open(file_path, 'r') as f:
        for line in f:
            if line.startswith('#'):
                processed_rows.append(line)
                continue
            
            parts = line.strip().split('\t')
            if len(parts) < 5:
                processed_rows.append(line)
                continue
            
            score, source, age_h, payout_hint, tags, url, title = parts[:7]
            
            # Check for dwarf_trace patterns
            is_dwarf_trace = False
            
            # Check title for patterns
            for pattern in patterns['title_patterns']:
                if re.search(pattern, title, re.IGNORECASE):
                    is_dwarf_trace = True
                    break
            
            # Check URL for GitHub issues
            if not is_dwarf_trace and 'github.com' in url:
                for pattern in patterns['url_patterns']:
                    if re.search(pattern, url):
                        # Check if title contains dwarf_trace keywords
                        for keyword in patterns['keywords']:
                            if keyword.lower() in title.lower():
                                is_dwarf_trace = True
                                break
                        if is_dwarf_trace:
                            break
            
            # Check tags for technical indicators
            if not is_dwarf_trace and 'TECHNICAL' in tags:
                for keyword in patterns['keywords']:
                    if keyword.lower() in title.lower():
                        is_dwarf_trace = True
                        break
            
            if is_dwarf_trace:
                # Enhance dwarf_trace issues
                enhanced_tags = tags + ',DWARF_TRACE'
                enhanced_title = title + ' [DWARF_TRACE]'
                
                # Create enhanced row
                enhanced_row = '\t'.join([score, source, age_h, payout_hint, enhanced_tags, url, enhanced_title])
                processed_rows.append(enhanced_row)
                dwarf_trace_issues.append(enhanced_row)
                print(f"Found dwarf_trace issue: {title}")
            else:
                processed_rows.append(line)
    
    # Write processed file
    with open(file_path, 'w') as f:
        f.write(''.join(processed_rows))
    
    # Log dwarf trace issues
    if dwarf_trace_issues:
        log_file = os.path.join(demand_dir, f'dwarf_trace_log_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')
        with open(log_file, 'w') as f:
            f.write(f"DWARF_TRACE ISSUES LOG - {datetime.now()}\n")
            f.write("=" * 50 + "\n\n")
            for issue in dwarf_trace_issues:
                f.write(issue + "\n")
        print(f"Logged {len(dwarf_trace_issues)} dwarf_trace issues to {log_file}")
    
    print(f"Processed {len(dwarf_trace_issues)} dwarf_trace issues in {latest_file}")

if __name__ == '__main__':
    process_demand_data()