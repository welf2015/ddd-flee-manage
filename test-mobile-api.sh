#!/bin/bash

# Mobile API Test Script
# Make sure your dev server is running: npm run dev

BASE_URL="http://localhost:3000/api/mobile"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Mobile API Test Script ===${NC}\n"

# You need to get your auth token first
# Login to your app and get the token from Supabase
echo -e "${RED}IMPORTANT: Set your auth token first!${NC}"
echo "Get token from: Supabase Dashboard > Auth > Users > Copy access token"
echo "Or login via web app and check browser console"
echo ""
read -p "Enter your Bearer Token: " TOKEN

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Error: Token is required${NC}"
    exit 1
fi

AUTH_HEADER="Authorization: Bearer $TOKEN"

echo -e "\n${BLUE}Testing APIs...${NC}\n"

# Test 1: Get Resources (Drivers, Vehicles, Clients)
echo -e "${GREEN}1. Getting Resources...${NC}"
curl -s -X GET "$BASE_URL/resources" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n"

# Test 2: List Bookings
echo -e "${GREEN}2. Listing Bookings...${NC}"
curl -s -X GET "$BASE_URL/bookings/list?limit=5" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n"

# Test 3: List Pending Bookings
echo -e "${GREEN}3. Listing Pending Bookings...${NC}"
curl -s -X GET "$BASE_URL/bookings/list?status=Pending" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n"

# Test 4: Create Booking
echo -e "${GREEN}4. Creating Test Booking...${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/bookings/create" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Test Client",
    "client_contact": "+2348012345678",
    "client_email": "test@example.com",
    "company_name": "Test Company",
    "route": "Lagos → Abuja",
    "pickup_address": "Victoria Island, Lagos",
    "delivery_address": "Wuse 2, Abuja",
    "pickup_lat": 6.4281,
    "pickup_lng": 3.4219,
    "delivery_lat": 9.0765,
    "delivery_lng": 7.4165,
    "destination_contact_name": "John Doe",
    "destination_contact_phone": "+2348087654321",
    "proposed_client_budget": 50000,
    "requires_waybill": true
  }')

echo "$CREATE_RESPONSE" | jq '.'

# Extract booking ID from response
BOOKING_ID=$(echo "$CREATE_RESPONSE" | jq -r '.booking.id // empty')

if [ ! -z "$BOOKING_ID" ]; then
    echo -e "\n${GREEN}✓ Booking created with ID: $BOOKING_ID${NC}\n"

    # Test 5: Get Booking Details
    echo -e "${GREEN}5. Getting Booking Details...${NC}"
    curl -s -X GET "$BASE_URL/bookings/$BOOKING_ID" \
      -H "$AUTH_HEADER" \
      -H "Content-Type: application/json" | jq '.'

    echo -e "\n"

    # Test 6: Update Status
    echo -e "${GREEN}6. Updating Booking Status to 'Approved'...${NC}"
    curl -s -X PATCH "$BASE_URL/bookings/$BOOKING_ID/status" \
      -H "$AUTH_HEADER" \
      -H "Content-Type: application/json" \
      -d '{
        "status": "Approved",
        "notes": "Approved via mobile API test"
      }' | jq '.'

    echo -e "\n"

    # Test 7: Assign Driver (if you have drivers)
    echo -e "${GREEN}7. Assigning Driver/Vehicle...${NC}"
    echo "Skipping - Add driver_id and vehicle_id to test"
    # Uncomment and add IDs to test:
    # curl -s -X PATCH "$BASE_URL/bookings/$BOOKING_ID/assign" \
    #   -H "$AUTH_HEADER" \
    #   -H "Content-Type: application/json" \
    #   -d '{
    #     "driver_id": "YOUR_DRIVER_ID",
    #     "vehicle_id": "YOUR_VEHICLE_ID"
    #   }' | jq '.'

    echo -e "\n"

    # Test 8: Close Job
    echo -e "${GREEN}8. Closing Job...${NC}"
    curl -s -X POST "$BASE_URL/bookings/$BOOKING_ID/close" \
      -H "$AUTH_HEADER" \
      -H "Content-Type: application/json" \
      -d '{
        "actual_cost": 48000,
        "incident_report": "Trip completed successfully"
      }' | jq '.'

    echo -e "\n${GREEN}✓ All tests completed!${NC}\n"
else
    echo -e "\n${RED}✗ Failed to create booking${NC}\n"
fi

echo -e "${BLUE}=== Test Complete ===${NC}"
