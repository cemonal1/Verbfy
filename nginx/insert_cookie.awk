BEGIN { printed=0 }
{
    print;
    if ($0 ~ /proxy_connect_timeout 75;/ && !printed) {
        print "            add_header X-Debug-Upstream-Set-Cookie $upstream_http_set_cookie always;";
        printed=1
    }
}