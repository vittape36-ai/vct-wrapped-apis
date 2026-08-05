#pragma once
#include <string>
#include <stdexcept>
// Requires libcurl and nlohmann/json
#include <curl/curl.h>
#include "nlohmann/json.hpp"

namespace vct {

class Client {
private:
    std::string api_key;
    std::string base_url;

    static size_t WriteCallback(void* contents, size_t size, size_t nmemb, void* userp) {
        ((std::string*)userp)->append((char*)contents, size * nmemb);
        return size * nmemb;
    }

public:
    Client(const std::string& key, const std::string& url = "https://api.vidyacoddle.tech") 
        : api_key(key), base_url(url) {
        curl_global_init(CURL_GLOBAL_DEFAULT);
    }

    ~Client() {
        curl_global_cleanup();
    }

    nlohmann::json chat(const std::string& prompt) {
        CURL* curl = curl_easy_init();
        if (!curl) throw std::runtime_error("Failed to init curl");

        std::string url = base_url + "/llm/v1/chat";
        nlohmann::json payload = {
            {"messages", {{{"role", "user"}, {"content", prompt}}}},
            {"model", "auto"}
        };
        std::string payload_str = payload.dump();

        struct curl_slist* headers = NULL;
        headers = curl_slist_append(headers, "Content-Type: application/json");
        std::string auth_header = "x-api-key: " + api_key;
        headers = curl_slist_append(headers, auth_header.c_str());

        std::string readBuffer;

        curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, payload_str.c_str());
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &readBuffer);

        CURLcode res = curl_easy_perform(curl);
        
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);

        if (res != CURLE_OK) {
            throw std::runtime_error(curl_easy_strerror(res));
        }

        return nlohmann::json::parse(readBuffer);
    }
};

} // namespace vct
