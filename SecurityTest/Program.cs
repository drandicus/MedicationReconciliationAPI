using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IdentityModel.Client;


namespace SecurityTest
{
    class Program
    {
        static void Main(string[] args)
        {
            var client = new TokenClient(
                "http://ec2-54-84-142-72.compute-1.amazonaws.com/connect/token",
                "medrecon_ro", //  Your client id
                "3C56A097-E0F7-44E7-A179-927E3C8771EE");  //  Your client secret

            TokenResponse response = client.RequestResourceOwnerPasswordAsync("medrecon", "medrecon", "medrecon").Result;    //  Your username/password/scopes

            Console.WriteLine(response.AccessToken);
            System.IO.File.WriteAllText("access_token.txt", response.AccessToken);

            Console.ReadLine();
        }
    }
}
