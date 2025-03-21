# Plant Project Deployment Guide for Azure

This document provides comprehensive instructions for deploying the Plant Data Management System to Azure. The application consists of a Django backend and a React frontend.

## Prerequisites

Before deployment, ensure you have:

- Git installed
- Python 3.13.2 installed
- Node.js (v20 or later) and npm installed
- Azure CLI installed and configured
- Access to an Azure subscription
- A Groq API key for the AI chat feature
- An email service account (for password reset functionality)

## Application Architecture

The application has two main components:

1. **Backend**: Django REST API with PostgreSQL database
2. **Frontend**: React application built with Vite and TypeScript

## 1. Preparing the Application for Deployment

### Backend Preparation

1. Create a production-ready `.env` file based on the example:

```bash
DEBUG=False
SECRET_KEY=your-secure-random-string  # Generate a secure random string
DB_NAME=your-production-database-name
DB_USER=your-production-database-user
DB_PASSWORD=your-production-database-password
DB_HOST=your-azure-postgresql-server.postgres.database.azure.com
DB_PORT=5432

# Email Configuration
EMAIL_HOST_USER=your-production-email
EMAIL_HOST_PASSWORD=your-production-email-password
EMAIL_HOST=smtp.gmail.com  # Or your email provider's SMTP server
EMAIL_PORT=587
EMAIL_USE_TLS=True

# Production Frontend URL
FRONTEND_URL=https://your-frontend-domain.azurewebsites.net

# Groq API Key
GROQ_API_KEY=your-groq-api-key
```

2. Update `settings.py` for production:

```python
# Update ALLOWED_HOSTS
ALLOWED_HOSTS = ['your-backend-domain.azurewebsites.net']

# Update CORS settings
CORS_ALLOWED_ORIGINS = [
    "https://your-frontend-domain.azurewebsites.net",
]
```

3. Configure static files for production by adding to your `settings.py`:

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Add this line
    # Other middleware...
]

# Configure WhiteNoise for static files
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

4. Create a `web.config` file in the root of your backend folder for Azure Web App:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="PythonHandler" path="*" verb="*" modules="FastCgiModule" scriptProcessor="D:\home\python\python313x64\python.exe|D:\home\python\wfastcgi.py" resourceType="Unspecified" requireAccess="Script" />
    </handlers>
    <rewrite>
      <rules>
        <rule name="Static Files" stopProcessing="true">
          <conditions>
            <add input="{{REQUEST_FILENAME}}" matchType="IsFile" negate="false" />
          </conditions>
          <action type="None" />
        </rule>
        <rule name="Configure Python" stopProcessing="true">
          <match url="(.*)" />
          <conditions>
            <add input="{{REQUEST_FILENAME}}" matchType="IsFile" negate="true" />
          </conditions>
          <action type="Rewrite" url="core/wsgi.py" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
  <appSettings>
    <add key="WSGI_HANDLER" value="django.core.wsgi.get_wsgi_application()" />
    <add key="PYTHONPATH" value="D:\home\site\wwwroot" />
    <add key="DJANGO_SETTINGS_MODULE" value="core.settings" />
  </appSettings>
</configuration>
```

### Frontend Preparation

1. Update the `.env` file for production:

```bash
VITE_API_URL=https://your-backend-domain.azurewebsites.net/api
```

2. Build the frontend:

```bash
cd frontend
npm install
npm run build
```

## 2. Azure Resources Setup

### Create Azure Database for PostgreSQL

1. Log in to the Azure portal and create a new Azure Database for PostgreSQL:

```bash
az login
az postgres server create --resource-group YourResourceGroup --name your-db-server-name --location eastus --admin-user YourAdminUser --admin-password YourPassword --sku-name GP_Gen5_2 --version 13
```

2. Configure firewall rules to allow your application to connect:

```bash
az postgres server firewall-rule create --resource-group YourResourceGroup --server your-db-server-name --name AllowAppService --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0
```

3. Create a database:

```bash
az postgres db create --resource-group YourResourceGroup --server-name your-db-server-name --name your-db-name
```

### Create Azure Web App for Backend

1. Create a Web App for the backend with Python 3.13.2 runtime:

```bash
az webapp create --resource-group YourResourceGroup --plan YourAppServicePlan --name your-backend-app-name --runtime "PYTHON|3.13"
```

2. Configure environment variables:

```bash
az webapp config appsettings set --resource-group YourResourceGroup --name your-backend-app-name --settings @backend/.env
```

3. Configure deployment source:

```bash
az webapp deployment source config --resource-group YourResourceGroup --name your-backend-app-name --repo-url https://github.com/your-username/your-repo --branch main --manual-integration
```

### Create Azure Web App for Frontend

1. Create a Web App for the frontend with Node.js runtime:

```bash
az webapp create --resource-group YourResourceGroup --plan YourAppServicePlan --name your-frontend-app-name --runtime "NODE|20-lts"
```

2. Configure frontend deployment:

```bash
az webapp deployment source config --resource-group YourResourceGroup --name your-frontend-app-name --repo-url https://github.com/your-username/your-repo --branch main --manual-integration
```

## 3. Deploying Applications to Azure

### Backend Deployment

1. Prepare backend for deployment:

```bash
# Create a virtual environment
python3.13 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install production dependencies
pip install -r backend/requirements.txt
pip install whitenoise  # For static file serving

# Collect static files
cd backend
python manage.py collectstatic --noinput
```

2. Configure Azure deployment settings by creating a `.deployment` file in the root of your backend:

```
[config]
project = backend
```

3. Create a deployment script `deploy.py` in your backend folder:

```python
import os
import sys
import subprocess

def main():
    print("Starting deployment process...")
    
    # Navigate to the project directory
    os.chdir('/home/site/wwwroot')
    
    # Install dependencies
    print("Installing dependencies...")
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
    
    # Collect static files
    print("Collecting static files...")
    subprocess.check_call([sys.executable, 'manage.py', 'collectstatic', '--noinput'])
    
    # Apply migrations
    print("Applying migrations...")
    subprocess.check_call([sys.executable, 'manage.py', 'migrate'])
    
    print("Deployment completed successfully!")

if __name__ == '__main__':
    main()
```

4. Deploy to Azure using Git:

```bash
git init
git add .
git commit -m "Initial deployment"
git remote add azure https://your-azure-deployment-username@your-backend-app-name.scm.azurewebsites.net:443/your-backend-app-name.git
git push azure main
```

5. After deployment, run initial setup:

```bash
az webapp ssh --resource-group YourResourceGroup --name your-backend-app-name
cd /home/site/wwwroot
python manage.py migrate
python manage.py createsuperuser
```

### Frontend Deployment

1. Update the deployment settings for the frontend by creating a `.deployment` file:

```
[config]
project = frontend
```

2. Create a deployment script `deploy.sh` in your frontend folder:

```bash
#!/bin/bash
echo "Installing dependencies..."
npm install

echo "Building the app..."
npm run build

echo "Deployment completed."
```

3. Create `web.config` file in the `dist` directory after build:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{{REQUEST_FILENAME}}" matchType="IsFile" negate="true" />
            <add input="{{REQUEST_FILENAME}}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".webp" mimeType="image/webp" />
      <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
      <mimeMap fileExtension=".woff2" mimeType="application/font-woff2" />
    </staticContent>
  </system.webServer>
</configuration>
```

4. Deploy to Azure using the Azure CLI:

```bash
cd frontend
az webapp deployment source config-local-git --resource-group YourResourceGroup --name your-frontend-app-name
git init
git add .
git commit -m "Initial frontend deployment"
git remote add azure https://your-azure-deployment-username@your-frontend-app-name.scm.azurewebsites.net:443/your-frontend-app-name.git
git push azure main
```

## 4. Azure CI/CD Pipeline Setup with GitHub Actions

Create a GitHub Actions workflow file at `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python 3.13
      uses: actions/setup-python@v4
      with:
        python-version: '3.13.2'
        
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r backend/requirements.txt
        
    - name: Collect static files
      run: |
        cd backend
        python manage.py collectstatic --noinput
        
    - name: Run tests
      run: |
        cd backend
        python manage.py test
        
    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'your-backend-app-name'
        publish-profile: ${{ secrets.BACKEND_PUBLISH_PROFILE }}
        package: 'backend'

  deploy-frontend:
    runs-on: ubuntu-latest
    needs: deploy-backend
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
        
    - name: Build
      run: |
        cd frontend
        npm run build
        
    - name: Prepare web.config
      run: |
        cd frontend
        cp web.config dist/web.config
        
    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'your-frontend-app-name'
        publish-profile: ${{ secrets.FRONTEND_PUBLISH_PROFILE }}
        package: 'frontend/dist'
```

## 5. Post-Deployment Setup

### Database Migration and Initial Setup

After deployment, run these commands through the Azure portal Kudu console (https://your-backend-app-name.scm.azurewebsites.net/DebugConsole):

```bash
cd site/wwwroot
D:\home\python\python313x64\python.exe manage.py migrate
D:\home\python\python313x64\python.exe manage.py createsuperuser
```

To load sample data (optional):
```bash
D:\home\python\python313x64\python.exe create_sample_data.py
```

### Configure Custom Domain and SSL

1. Add a custom domain in the Azure portal for both apps:
   - Go to your App Service > Custom domains
   - Click on "Add custom domain"
   - Follow the instructions to verify domain ownership

2. Enable managed certificates:
   - In the Custom domain section, click on "Add binding" next to your domain
   - Select "TLS/SSL Certificate Type" as "Managed Certificate"
   - Click "Add Binding"

## 6. Maintenance and Monitoring

### Azure Application Insights

1. Create an Application Insights resource:

```bash
az monitor app-insights component create --app YourAppInsights --location eastus --resource-group YourResourceGroup --application-type web
```

2. Get the instrumentation key and add it to your settings:

```bash
az monitor app-insights component show --app YourAppInsights --resource-group YourResourceGroup --query instrumentationKey -o tsv
```

3. Add the Application Insights to your Django application by installing:

```bash
pip install opencensus-ext-azure
```

4. Update `settings.py`:

```python
MIDDLEWARE = [
    # Add this to the beginning of middleware list
    'opencensus.ext.django.middleware.OpencensusMiddleware',
    # Other middleware...
]

# Application Insights settings
OPENCENSUS = {
    'TRACE': {
        'SAMPLER': 'opencensus.trace.samplers.ProbabilitySampler(rate=1.0)',
        'EXPORTER': '''opencensus.ext.azure.trace_exporter.AzureExporter(
            connection_string="InstrumentationKey=00000000-0000-0000-0000-000000000000"
        )''',
    }
}
```

### Backup Strategy

1. Configure automated backups for your PostgreSQL database in Azure Portal:
   - Go to your PostgreSQL server
   - Click on "Backups"
   - Configure your desired retention period

2. Set up scheduled exports of data:

```bash
# Create a Storage Account for backups
az storage account create --name yourstorageaccount --resource-group YourResourceGroup --location eastus --sku Standard_LRS

# Create a container
az storage container create --name backups --account-name yourstorageaccount
```

3. Set up a scheduled task in Azure Logic Apps to export data periodically.

## 7. Security Best Practices

1. **Enable Azure Security Center**:
   - Go to Azure Security Center in the portal
   - Enable on your subscription

2. **Configure Azure Key Vault** for storing secrets:

```bash
# Create a Key Vault
az keyvault create --name YourKeyVault --resource-group YourResourceGroup --location eastus

# Store your secrets
az keyvault secret set --vault-name YourKeyVault --name "DB-PASSWORD" --value "your-database-password"
az keyvault secret set --vault-name YourKeyVault --name "SECRET-KEY" --value "your-django-secret-key"
az keyvault secret set --vault-name YourKeyVault --name "GROQ-API-KEY" --value "your-groq-api-key"
```

3. **Configure Managed Identity** for your web app:

```bash
# Enable managed identity
az webapp identity assign --resource-group YourResourceGroup --name your-backend-app-name

# Get the principal ID
principalId=$(az webapp identity show --resource-group YourResourceGroup --name your-backend-app-name --query principalId --output tsv)

# Grant access to Key Vault
az keyvault set-policy --name YourKeyVault --object-id $principalId --secret-permissions get list
```

4. **Web Application Firewall**:
   - Enable Azure Web Application Firewall (WAF) to protect your application
   - Configure rules to block common attacks

## 8. Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Check database credentials in .env file
   - Ensure firewall rules are properly configured
   - Verify network connectivity

2. **CORS Errors**:
   - Verify CORS_ALLOWED_ORIGINS in settings.py includes your frontend domain
   - Check for HTTPS/HTTP mismatches

3. **Static Files Not Loading**:
   - Check STATIC_ROOT and STATIC_URL settings
   - Verify WhiteNoise configuration
   - Examine web server logs in Kudu console (https://your-backend-app-name.scm.azurewebsites.net/DebugConsole)

4. **Email Service Issues**:
   - Verify email credentials
   - Test email connection through the Kudu console:
     ```python
     from django.core.mail import send_mail
     send_mail('Test', 'Message', 'from@example.com', ['to@example.com'])
     ```

## Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Azure PostgreSQL Documentation](https://docs.microsoft.com/en-us/azure/postgresql/)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/)
- [Python on Azure App Service](https://docs.microsoft.com/en-us/azure/app-service/configure-language-python)
- [React Production Build](https://vitejs.dev/guide/build.html)