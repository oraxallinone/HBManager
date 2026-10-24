namespace HBManager.Service
{
    public interface ILoginService
    {
        LoginResult CheckLogin(string userName, string userPassword);
    }
}
