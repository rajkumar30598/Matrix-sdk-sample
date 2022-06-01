import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MatrixUserManagementService {

  constructor() { }

  /** The Admin-Api */


  public async getAdminAccessToken(): Promise<any>{

    const body = {
      "type": "m.login.password",
      "user": environment.adminMatrixAccount.username,
      "password": environment.adminMatrixAccount.password
    };
    const url = environment.matrixServerBaseUrl.concat("/_matrix/client/r0/login");

    const postData: CallableFunction = this.postData.bind(this);
    return new Promise(function(resolve, reject){

      const promise = postData(url, body);
      promise.then(
        (res:any)=>{
          resolve(res.access_token);
        },
        (err:any)=>{
          reject(err);
        }
      )

    });
  }
/*
  public async changePersonalPassword(newPassword:string): Promise<any>{
    const accessToken =  window.sessionStorage.getItem(MatrixSdkAccessService.ACCESS_TOKEN_SESSION_STORE_LOC);
    if (! accessToken) {
      return;
    }
    const url = environment.matrixServerBaseUrl.concat("/_matrix/client/r0/account/password?access_token=", accessToken);
    const body = {
      'new_password': newPassword,
    }

    const postData: CallableFunction = this.postData.bind(this);
    return new Promise(function(resolve, reject){
      const promise = postData(url, body);
      promise.then(
        (res:any)=>{
          resolve(res);
          console.log("Result from changing password:");
        },
        (err:any)=>{
          reject(err);
        }
      )
    });

  }
*/
  public async createNewUser(username: string, password: string): Promise<any>{
    const accesToken = await this.getAdminAccessToken();
    //await this.postData(MatrixSdkAccessService.BASE_URL.concat("/_synapse/admin/v1/registration_tokens/new?access_token=", accesToken), {});

    const registerTokenRequest = fetch(environment.matrixServerBaseUrl.concat("/_synapse/admin/v1/registration_tokens?access_token=", accesToken));
    
    const postData = this.postData.bind(this);
    registerTokenRequest.then(
      (fetchRes: any) => {
        fetchRes.json().then(
          (jsonRes: any) =>{
            console.log(jsonRes);
            const registerAccessToken = jsonRes.registration_tokens[0];
            const registrationRequestUrl = environment.matrixServerBaseUrl.concat("/_matrix/client/r0/register");
            const registrationRequestData = {
              "auth": {
                "type": "m.login.registration_token",
                "token": registerAccessToken,
                "session": "xxxxx"
              },
              "device_id": "ABC",
              "initial_device_display_name": "Some Client",
              "password": "secret",
              "username": "max.muster"
            }
            postData(registrationRequestUrl, registrationRequestData).then(
              (res: any)=>{
                console.log(res);
              }
            )

          },
    )})
    return;
    const body = {
      "username": username,
      "password": password,
      "auth": {"type":"m.login.password"}
    };
    const url = environment.matrixServerBaseUrl.concat("/_matrix/client/r0/register");

    return new Promise(function(resolve, reject){
      const promise = postData(url, body);
      promise.then(
        (res:any)=>{
          resolve(res.access_token);
        },
        (err:any)=>{
          reject(err);
        }
      )
    });
  }


  public listAllMatrixUsersOnServer(){
    const body = {
      "type": "m.login.password",
      "identifier": {
        "type": "m.id.user",
        "user": "<user_id or user localpart>"
      },
      "password": "<password>"
    }

    /**
     * curl -XPOST -d '{"username":"example", "password":"wordpass", "auth": {"type":"m.login.dummy"}}' "https://localhost:8448/_matrix/client/r0/register"

      {
          "access_token": "QGV4YW1wbGU6bG9jYWxob3N0.AqdSzFmFYrLrTmteXc",
          "home_server": "localhost",
          "user_id": "@example:localhost"
      }
     */
  }

  private postData(url:string, data:any): Promise<any>{

    return new Promise(function(resolve, reject){
      let response = fetch(url, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json"
        }
    });
      

      response.then(
        (fetchRes: any) => {
          fetchRes.json().then(
            (jsonRes: any) =>{
              resolve(jsonRes);
            },
            (jsonErr: any)=>{
              reject("Error while fetching json: " + jsonErr);
            }
          )
        },
        (fetchErr: string) => {
          reject("Error during fetch: " + fetchErr)
        }
      )
    });
  }
}
