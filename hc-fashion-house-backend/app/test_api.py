"""
Test script to verify API changes for product listing
Run after restarting the backend server
"""
import requests
import json

def test_product_listing():
    print("Testing Product Listing API...")
    print("-" * 60)
    
    response = requests.get('http://localhost:8000/api/v1/catalogue/products/listing?tags=bestseller&per_page=1')
    
    if response.status_code == 200:
        data = response.json()
        if data.get('items'):
            product = data['items'][0]
            
            print(f"Product: {product.get('name')}")
            print(f"Brand: {product.get('brand_name')}")
            print(f"Price: ₹{product.get('price')}")
            print(f"MRP: ₹{product.get('mrp')}")
            print(f"Discount: {product.get('discount_percentage')}%")
            print("-" * 60)
            
            # Check required fields
            checks = {
                'available_sizes': product.get('available_sizes'),
                'available_colors': product.get('available_colors'),
                'short_description': product.get('short_description'),
                'mrp': product.get('mrp'),
                'color': product.get('color'),
                'color_hex': product.get('color_hex'),
            }
            
            print("\nField Verification:")
            all_passed = True
            for field, value in checks.items():
                status = "✓ PASS" if value is not None else "✗ FAIL"
                if value is None:
                    all_passed = False
                print(f"  {field}: {status}")
                if value is not None and field in ['available_sizes', 'available_colors']:
                    print(f"    Value: {value}")
            
            print("-" * 60)
            if all_passed:
                print("✓ ALL CHECKS PASSED!")
            else:
                print("✗ SOME CHECKS FAILED - Server may need restart")
                
        else:
            print('No products found with bestseller tag')
    else:
        print(f'Error: {response.status_code}')
        print(response.text)

if __name__ == '__main__':
    test_product_listing()
