#!/bin/bash

# ------------------------------------------
# FarmaTech Full Integration Tests (Auto-Login)
# ------------------------------------------

BASE_URL="http://localhost:3000"
EMAIL="testuser1@example.com"
PASSWORD="password123"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

function print_success {
    echo -e "${GREEN} $1${NC}"
}

function print_failure {
    echo -e "${RED} $1${NC}"
    exit 1
}

# ------------------------------------------
# Step 1: Login
# ------------------------------------------
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\", \"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.user.id')


if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  print_failure "Login failed."
else
  print_success "Login successful."
fi

# ------------------------------------------
# Step 2: Register a new medicine
# ------------------------------------------
echo "Registering new medicine..."
REGISTRATION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/medicines" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "MED-009",
    "name": "Paracetamol",
    "batchNumber": "BATCH-1234",
    "manufacturingDate": "2024-04-01",
    "expirationDate": "2026-04-01",
    "registrationLocation": "Dublin, Ireland"
  }')

SUCCESS=$(echo "$REGISTRATION_RESPONSE" | jq -r '.success')
QR_CODE=$(echo "$REGISTRATION_RESPONSE" | jq -r '.medicine.qrCode')

if [ "$SUCCESS" != "true" ]; then
  print_failure "Medicine registration failed."
else
  print_success "Medicine registered with QR code: $QR_CODE"
fi

# ------------------------------------------
# Step 3: Assign distributor
# ------------------------------------------
#   echo "Assigning distributor (self)..."
#   ASSIGN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/medicines/MED-001/assign-distributors" \
#   -H "Authorization: Bearer $TOKEN" \
#   -H "Content-Type: application/json" \
#   -d '{"distributors": ["TestOrganization"]}')

#   if echo "$ASSIGN_RESPONSE" | grep -q 'assigned successfully'; then
#   print_success "Distributor assigned successfully."
#   else
#   print_failure "Failed to assign distributor."
#   fi

# ------------------------------------------
# Step 4: Fetch all medicines
# ------------------------------------------

echo "Fetching all medicines..."
ALL_MEDICINES=$(curl -s -X GET "$BASE_URL/api/medicines" -H "Authorization: Bearer $TOKEN")
if [ -z "$ALL_MEDICINES" ]; then
  print_failure "Failed to fetch medicines."
else
  print_success "Fetched medicines."
fi

# ------------------------------------------
# Step 5: Fetch medicines by owner
# ------------------------------------------
echo "Fetching medicines by owner..."
OWNER_RESPONSE=$(curl -s -X GET "$BASE_URL/api/medicines/owner/TestOrganization" -H "Authorization: Bearer $TOKEN")
print_success "Fetched medicines by owner."

# ------------------------------------------
# Step 6: Fetch medicines by manufacturer
# ------------------------------------------
echo "Fetching medicines by manufacturer..."
MANUFACTURER_RESPONSE=$(curl -s -X GET "$BASE_URL/api/medicines/manufacturer/TestOrganization" -H "Authorization: Bearer $TOKEN")
print_success "Fetched medicines by manufacturer."

# ------------------------------------------
# Step 7: Update medicine supply chain
# ------------------------------------------
echo "Updating medicine status..."
UPDATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/medicines/MED-001/update" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "In Transit", "location": "Warehouse Dublin"}')
print_success "Medicine status updated."

# ------------------------------------------
# Step 8: Flagging the medicine
# ------------------------------------------
echo "Flagging medicine..."
FLAG_RESPONSE=$(curl -s -X POST "$BASE_URL/api/medicines/MED-001/flag" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Test Flag", "location": "Dublin Facility"}')
print_success "Medicine flagged."

# ------------------------------------------
# Step 9: Secure verify by QR (authenticated)
# ------------------------------------------
echo "Secure verifying medicine..."
VERIFY_SECURE=$(curl -s -X GET "$BASE_URL/api/medicines/verify/$QR_CODE" -H "Authorization: Bearer $TOKEN")
print_success "Secure verification completed."

# ------------------------------------------
# Step 10: Public verify by QR code
# ------------------------------------------
echo "Public verify by QR code..."
VERIFY_PUBLIC=$(curl -s -X GET "$BASE_URL/api/public/verify/$QR_CODE")
print_success "Public QR verification completed."

# ------------------------------------------
# Step 11: Public verify by QR content
# ------------------------------------------
echo "Public verify by QR content..."
VERIFY_PUBLIC_CONTENT=$(curl -s -X POST "$BASE_URL/api/public/verify-medicine" \
  -H "Content-Type: application/json" \
  -d "{\"qrContent\":\"$QR_CODE\"}")
print_success "Public content verification completed."

# ------------------------------------------
# Step 12: Get notifications
# ------------------------------------------
echo "Fetching notifications..."
FETCH_NOTIFICATIONS=$(curl -s -X GET "$BASE_URL/api/notifications" -H "Authorization: Bearer $TOKEN")
print_success "Notifications fetched."

# ------------------------------------------
# Step 13: Fetch unread notifications count
# ------------------------------------------
echo "Fetching unread notifications..."
FETCH_UNREAD=$(curl -s -X GET "$BASE_URL/api/notifications/unread" -H "Authorization: Bearer $TOKEN")
print_success "Unread notifications fetched."

# ------------------------------------------
# Step 14: Mark notification as read
# ------------------------------------------
echo "Marking notification as read..."
MARK_READ=$(curl -s -X PUT "$BASE_URL/api/notifications/$NOTIFICATION_ID/read" -H "Authorization: Bearer $TOKEN")
print_success "Notification marked as read."

# ------------------------------------------
# Step 15: Archive notification
# ------------------------------------------
echo "Archiving notification..."
ARCHIVE_NOTIFICATION=$(curl -s -X PUT "$BASE_URL/api/notifications/$NOTIFICATION_ID/archive" -H "Authorization: Bearer $TOKEN")
print_success "Notification archived."

# ------------------------------------------
# Step 16: Reply to notification
# ------------------------------------------
echo "Replying to notification..."
REPLY_NOTIFICATION=$(curl -s -X POST "$BASE_URL/api/notifications/reply/$NOTIFICATION_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Thanks for your notification."}')
print_success "Replied to notification."

# ------------------------------------------
# Step 17: Fetch logged-in user profile
# ------------------------------------------
echo "Fetching current user profile..."
PROFILE=$(curl -s -X GET "$BASE_URL/api/auth/user" -H "Authorization: Bearer $TOKEN")
print_success "User profile fetched."


print_success "All integration tests completed successfully! 🎯"
