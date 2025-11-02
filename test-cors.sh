#!/bin/bash

# 🧪 CORS Test Script for Verbfy Production

echo "🧪 Testing CORS Configuration..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Test 1: Health endpoint
print_test "Testing health endpoint..."
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://api.verbfy.com/api/health)
if [[ "$HEALTH" == "200" ]]; then
    print_pass "Health endpoint: HTTP $HEALTH"
else
    print_fail "Health endpoint: HTTP $HEALTH"
fi

# Test 2: CORS preflight from www.verbfy.com
print_test "Testing CORS preflight from www.verbfy.com..."
CORS_WWW=$(curl -s -I \
    -H "Origin: https://www.verbfy.com" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" \
    -X OPTIONS \
    https://api.verbfy.com/api/auth/login | grep -i "access-control-allow-origin")

if [[ -n "$CORS_WWW" ]]; then
    print_pass "CORS from www.verbfy.com: $CORS_WWW"
else
    print_fail "CORS from www.verbfy.com: No CORS headers found"
fi

# Test 3: CORS preflight from verbfy.com
print_test "Testing CORS preflight from verbfy.com..."
CORS_APEX=$(curl -s -I \
    -H "Origin: https://verbfy.com" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" \
    -X OPTIONS \
    https://api.verbfy.com/api/auth/login | grep -i "access-control-allow-origin")

if [[ -n "$CORS_APEX" ]]; then
    print_pass "CORS from verbfy.com: $CORS_APEX"
else
    print_fail "CORS from verbfy.com: No CORS headers found"
fi

# Test 4: Actual API call simulation
print_test "Testing actual API call simulation..."
API_CALL=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Origin: https://www.verbfy.com" \
    -H "Content-Type: application/json" \
    -X POST \
    -d '{"email":"test@example.com","password":"test"}' \
    https://api.verbfy.com/api/auth/login)

if [[ "$API_CALL" == "400" || "$API_CALL" == "401" || "$API_CALL" == "422" ]]; then
    print_pass "API call reaches backend: HTTP $API_CALL (expected auth error)"
elif [[ "$API_CALL" == "403" ]]; then
    print_fail "API call blocked by CORS: HTTP $API_CALL"
else
    print_warn "API call unexpected response: HTTP $API_CALL"
fi

# Test 5: Check SSL certificate
print_test "Testing SSL certificate..."
SSL_CHECK=$(curl -s -I https://api.verbfy.com | head -n 1)
if [[ "$SSL_CHECK" == *"200"* ]]; then
    print_pass "SSL certificate: Working"
else
    print_warn "SSL certificate: $SSL_CHECK"
fi

echo ""
echo "🏁 CORS Test Complete!"
echo ""
echo "If tests are failing, run the fix script:"
echo "chmod +x fix-cors-production.sh && ./fix-cors-production.sh"