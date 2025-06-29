#!/usr/bin/env python3

import os
import re


def fix_url_field(content):
    """Remove /news/ prefix from url field in front matter"""
    # Pattern to match url = "/news/..." and replace with url = "/..."
    pattern = r'url = "/news/([^"]+)"'
    replacement = r'url = "/\1"'
    return re.sub(pattern, replacement, content)


def process_markdown_files(directory):
    """Process all markdown files in the directory and subdirectories"""
    count = 0
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.md'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()

                    # Check if this file has a url field that needs fixing
                    if 'url = "/news/' in content:
                        new_content = fix_url_field(content)

                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(new_content)

                        print(f'Fixed: {file_path}')
                        count += 1

                except Exception as e:
                    print(f'Error processing {file_path}: {e}')

    return count


if __name__ == '__main__':
    content_dir = 'content/news'
    if os.path.exists(content_dir):
        fixed_count = process_markdown_files(content_dir)
        print(f'\nFixed {fixed_count} files')
    else:
        print(f'Directory {content_dir} not found')
