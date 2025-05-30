// Test Firebase private key validation
import admin from 'firebase-admin'

const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCbTTuyEC5ZYP0W
duUd+AQA4fsVcHLEP52ybI9+QIptIefE4JOsMIkwYwdosNnGQHWJGw+y8ucPm0E8
bEcpW6wX+0VnMJTeWdFQbP4q5Ts0b2Vl7Wi4mgMl/oRETMENdgMteetrhG798FWx
MCRy92unRJEyDgm6+PKuFHeUeRno1rMN6Qx/A6Yk//7PI8zCtQTCDpdXhKV+zubA
dpeVpA6pl0UF99IxBUdxZJAtLZASdSo2lWqTi5Akhz5dR1ChKZPwDg/5jb953oPL
MOUIrSGVfRxYRbshc4Ze4xx4VJHbs/Y/M6r/P94Ll2NJ4oNAIJH78k4ajdYisGAB
3Oy9tSpvAgMBAAECggEAAXL1iSJMhGn6wpBmb+KmCuoQ4TDU6U7cplML/bYVdJI5
6uTbi+JCDXEHGyt3RLnKPvbBLT7F+CfPMoSiH1krIGgoTB+wa+izosf5kSXlaQZX
EF3oOby6JcsbqdV7gaglvHFkSHMKZBUvf4E+/dGgMAXcQvbNkXCMNyKawQhmPP1s
ImbAmO0nQrKg4MSpOj5jdLFjhcoNSDTHBUIR4S9fk3OgGMfJ0TVoXrEa7HdUdVVK
u9Cy44nz2bX1xqpQPV7tTleq/t/3U6F0Cqocqi0CxqM5Cf8J/QzEZBOvhJ2YyJIU
oRN85PfiGHasNjp/1Yw5/WFhoIqjLqYs9Ed6woFd4QKBgQDMkqrdf7yj7umKJ7A7
NM7wPDtb4IRboKoycQZGbKQz10zddWmDzD87jQIu08Qe7j5kmxKsiL3UA5mYXg+y
EOsgCrsY3hVVoVy0iTk8ZAeGiOaM7l4ZTnGbi5Ytkv6oQu6nW1VOXV2aX4COP1W
SngjCnBlgQo/XqM5zuPvqa1n4QKBgQDCV7So9OppDOXchVDSsW9PugLeCHLB6QDQ
w11royMe7JSxfpoyWInwOFUlCO0i/w8upFSbMgNeEzFDxdNkYO3+WYAyo7Sfrw6v
YTl+m/V42VXgPuPDbkBDdZfWrhmWh/QiB3S2ScGWKqx1aVmINDg4rzTgDL1El4aD
KB2afoWcTwKBgHPBDdO1gq0T86uL14k40VtYCZJsURhzqbpO/+j7clIvIjwxQpok
CSeOG00Z4GBMGJver0tXOGpt+wwfNSywhQ5nm2IUyrMm+O3GgL/W++A8lCad2/WG
+ZERKUJjLEzNsZBPodzWXWO6P2XMj3SzQJU7Q+v7fyvqRdvg+FLVJNyhAoGAChyq
J8hmkgS7yReetvfIhOt2zrq9zd0jz7j6mWkpoKhKrFmcCFaXBsrHk1+9hv6ieZjP
VivqBPEWtSIL98MbXwqlIv1lnpFrQDDc3vuacClO0JY1H6wS5++scN0qM6zrRQIC
TqHT0s5xnsJWiEG/UyO6qpW/G1yPATALKki/Bv0CgYEAhgOhbZa9rH12Gn5Kw5xf
qz8a5TrkONMJW+xAfOJF/qDwQnFaCX2GCjxEgzP54OEHBSsWD9LrEFISQZcpd8oo
PK1KX9erXPYcZ4SToO5zsV5cJjcUMJUxcbuAQPXaT7op7tX2YACGcWYozKsm0G2m
41J6fSNlF4bxj1OoOP3NFHI=
-----END PRIVATE KEY-----`

const serviceAccount = {
  type: 'service_account',
  project_id: 'socialmm-c0c2d',
  private_key_id: 'ea1eb647d18062afabf8937cea3b336e14c0c63e',
  private_key: privateKey,
  client_email:
    'firebase-adminsdk-fbsvc@socialmm-c0c2d.iam.gserviceaccount.com',
  client_id: '102259138690885537971',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url:
    'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40socialmm-c0c2d.iam.gserviceaccount.com',
}

console.log('Testing Firebase private key...')
console.log('Private key length:', privateKey.length)
console.log('Private key lines:', privateKey.split('\n').length)

try {
  const credential = admin.credential.cert(serviceAccount)
  console.log('✅ Private key is valid!')
  console.log('Credential created successfully')
} catch (error) {
  console.error('❌ Private key validation failed:', error.message)
  console.error('Error details:', error)
}
