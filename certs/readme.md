Here’s how to generate a self-signed CA certificate and a server certificate with SAN using `san.cnf`:

---

### 1. **Create the SAN Config File**

Create a file named `san.cnf` with the following content:

```
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = opensearch-node1

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = opensearch-node1
DNS.2 = opensearch-node2
DNS.3 = localhost
IP.1 = 127.0.0.1
```

---

### 2. **Generate the CA Key and Certificate**

```sh
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 -out ca.pem -subj "/CN=MyLocalCA"
```

---

### 3. **Generate the Server Key and Certificate Signing Request (CSR)**

```sh
openssl genrsa -out opensearch.key 4096
openssl req -new -key opensearch.key -out opensearch.csr -config san.cnf
```

---

### 4. **Sign the Server Certificate with the CA and SAN**

```sh
openssl x509 -req -in opensearch.csr -CA ca.pem -CAkey ca.key -CAcreateserial -out opensearch.crt -days 3650 -sha256 -extfile san.cnf -extensions v3_req
```

---

### **Resulting Files**
- `ca.pem` — CA certificate (for Logstash and clients)
- `ca.key` — CA private key (keep safe)
- `opensearch.key` — Server private key (for OpenSearch)
- `opensearch.crt` — Server certificate (for OpenSearch)

---

**Summary:**  
- Use `san.cnf` to specify SANs.
- Use `ca.pem` for clients, `opensearch.crt` and `opensearch.key` for OpenSearch.

Let me know if you need help mounting these in Docker or configuring OpenSearch/Logstash!


**Thumbprint**

---------------------------
Security Warning
---------------------------
You are about to install a certificate from a certification authority (CA) claiming to represent:



opensearch-node1
---------------------


Windows cannot validate that the certificate is actually from "opensearch-node1". You should confirm its origin by contacting "opensearch-node1". The following number will assist you in this process:



Thumbprint (sha1): CA40CF06 8C954FBE 3079E980 2AD43578 E4611FC0



Warning:

If you install this root certificate, Windows will automatically trust any certificate issued by this CA. Installing a certificate with an unconfirmed thumbprint is a security risk. If you click "Yes" you acknowledge this risk.



Do you want to install this certificate?


---------------------------
Yes   No   
---------------------------
