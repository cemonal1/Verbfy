#!/bin/bash

# CORS Testing Script for Verbfy API
# Tests CORS configuration for both apex and www domains

echo "🔧 Testing CORS Configuration for Verbfy API"
echo "=============================================="

API_URL="https://api.verbfy.com"
HEALTH_ENDPOINT="/api/health"
LOGIN_ENDPOINT="/api/auth/login"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "📍 Testing API Health Endpoint: ${API_URL}${HEALTH_ENDPOINT}"
echo ""

# Test 1: Apex domain (verbfy.com)
echo "🧪 Test 1: CORS from apex domain (https://verbfy.com)"
echo "---------------------------------------------------"
RESPONSE=$(curl -s -I -H "Origin: https://verbfy.com" "${API_URL}${HEALTH_ENDPOINT}")
CORS_ORIGIN=$(echo "$RESPONSE" | grep -i "access-control-allow-origin" | cut -d' ' -f2- | tr -d '\r')

if [[ "$CORS_ORIGIN" == "https://verbfy.com" ]]; then
    echo -e "${GREEN}✅ PASS${NC} - Correct CORS origin: $CORS_ORIGIN"
else
    echo -e "${RED}❌ FAIL${NC} - Incorrect CORS origin: $CORS_ORIGIN"
fi

# Test 2: WWW subdomain (www.verbfy.com)
echo ""
echo "🧪 Test 2: CORS from www subdomain (https://www.verbfy.com)"
echo "--------------------------------------------------------"
RESPONSE=$(curl -s -I -H "Origin: https://www.verbfy.com" "${API_URL}${HEALTH_ENDPOINT}")
CORS_ORIGIN=$(echo "$RESPONSE" | grep -i "access-control-allow-origin" | cut -d' ' -f2- | tr -d '\r')

if [[ "$CORS_ORIGIN" == "https://www.verbfy.com" ]]; then
    echo -e "${GREEN}✅ PASS${NC} - Correct CORS origin: $CORS_ORIGIN"
else
    echo -e "${RED}❌ FAIL${NC} - Incorrect CORS origin: $CORS_ORIGIN"
fi

# Test 3: Unauthorized origin (should be blocked)
echo ""
echo "🧪 Test 3: CORS from unauthorized origin (should be blocked)"
echo "----------------------------------------------------------"
RESPONSE=$(curl -s -I -H "Origin: https://malicious.com" "${API_URL}${HEALTH_ENDPOINT}")
CORS_ORIGIN=$(echo "$RESPONSE" | grep -i "access-control-allow-origin" | cut -d' ' -f2- | tr -d '\r')

if [[ -z "$CORS_ORIGIN" ]] || [[ "$CORS_ORIGIN" == "" ]]; then
    echo -e "${GREEN}✅ PASS${NC} - Unauthorized origin correctly blocked (empty CORS header)"
else
    echo -e "${RED}❌ FAIL${NC} - Unauthorized origin not blocked: $CORS_ORIGIN"
fi

# Test 4: Preflight request for login endpoint
echo ""
echo "🧪 Test 4: Preflight request for login endpoint"
echo "----------------------------------------------"
RESPONSE=$(curl -s -I \
    -H "Origin: https://www.verbfy.com" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" \
    -X OPTIONS \
    "${API_URL}${LOGIN_ENDPOINT}")

CORS_ORIGIN=$(echo "$RESPONSE" | grep -i "access-control-allow-origin" | cut -d' ' -f2- | tr -d '\r')
CORS_METHODS=$(echo "$RESPONSE" | grep -i "access-control-allow-methods" | cut -d' ' -f2- | tr -d '\r')
CORS_CREDENTIALS=$(echo "$RESPONSE" | grep -i "access-control-allow-credentials" | cut -d' ' -f2- | tr -d '\r')

echo "Origin: $CORS_ORIGIN"
echo "Methods: $CORS_METHODS"
echo "Credentials: $CORS_CREDENTIALS"

if [[ "$CORS_ORIGIN" == "https://www.verbfy.com" ]] && [[ "$CORS_CREDENTIALS" == "true" ]]; then
    echo -e "${GREEN}✅ PASS${NC} - Preflight request configured correctly"
else
    echo -e "${RED}❌ FAIL${NC} - Preflight request configuration issues"
fi

# Test 5: Check for multiple values in single header (the original problem)
echo ""
echo "🧪 Test 5: Verify no multiple values in CORS header"
echo "--------------------------------------------------"
RESPONSE=$(curl -s -I -H "Origin: https://verbfy.com" "${API_URL}${HEALTH_ENDPOINT}")
CORS_ORIGIN=$(echo "$RESPONSE" | grep -i "access-control-allow-origin" | cut -d' ' -f2- | tr -d '\r')

if [[ "$CORS_ORIGIN" == *","* ]]; then
    echo -e "${RED}❌ FAIL${NC} - Multiple values detected in CORS header: $CORS_ORIGIN"
    echo -e "${YELLOW}⚠️  This will cause CORS errors in browsers!${NC}"
else
    echo -e "${GREEN}✅ PASS${NC} - Single origin value in CORS header: $CORS_ORIGIN"
fi

echo ""
echo "🏁 CORS Testing Complete"
echo "======================="

# Summary
echo ""
echo "📋 Summary:"
echo "- Test CORS configuration after deploying nginx changes"
echo "- Both https://verbfy.com and https://www.verbfy.com should work"
echo "- Unauthorized origins should be blocked"
echo "- No multiple values should appear in CORS headers"
echo ""
echo "🚀 If all tests pass, CORS configuration is working correctly!"