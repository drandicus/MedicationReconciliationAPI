using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Owin;
using Owin;
using IdentityServer3.AccessTokenValidation;
using System.Web.Http;

[assembly: OwinStartup(typeof(MedicationReconciliationAPI.Startup))]

namespace MedicationReconciliationAPI
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);

            app.UseIdentityServerBearerTokenAuthentication(new IdentityServerBearerTokenAuthenticationOptions
            {
                Authority = "http://ec2-54-84-142-72.compute-1.amazonaws.com",
                ValidationMode = ValidationMode.ValidationEndpoint,
                RequiredScopes = new[] { "medrecon" }   //  Your Scope Here
            });

            var config = new HttpConfiguration();
            config.MapHttpAttributeRoutes();

            app.UseWebApi(config);
        }
    }
}
