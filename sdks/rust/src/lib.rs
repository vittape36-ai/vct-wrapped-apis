use reqwest::Client;
use serde_json::{json, Value};
use std::error::Error;

pub struct VctClient {
    api_key: String,
    base_url: String,
    client: Client,
}

impl VctClient {
    pub fn new(api_key: &str) -> Self {
        Self {
            api_key: api_key.to_string(),
            base_url: "https://api.vidyacoddle.tech".to_string(),
            client: Client::new(),
        }
    }

    pub fn with_base_url(mut self, url: &str) -> Self {
        self.base_url = url.to_string();
        self
    }

    pub async fn chat(&self, prompt: &str) -> Result<Value, Box<dyn Error>> {
        let url = format!("{}/llm/v1/chat", self.base_url);
        let payload = json!({
            "messages": [{"role": "user", "content": prompt}],
            "model": "auto"
        });

        let res = self.client.post(&url)
            .header("x-api-key", &self.api_key)
            .json(&payload)
            .send()
            .await?;

        let json = res.json::<Value>().await?;
        Ok(json)
    }
}
