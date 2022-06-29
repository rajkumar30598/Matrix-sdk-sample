import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MatrixUserManagementService {

  constructor() { }

  /* General */

  private static getAccessToken(username:string, password:string): Promise<string>{
    const body = {
      "type": "m.login.password",
      "user": username,
      "password": password
    };
    const url = environment.matrixServerBaseUrl.concat("/_matrix/client/r0/login");

    return new Promise(function(resolve, reject){
      MatrixUserManagementService.postData(url, body).then(
        (res:any)=>{
          resolve(res.access_token);
        },
        (err:any)=>{
          reject(err);
        }
      )
    });
  }

  private static getAdminAccessToken(): Promise<string>{
    return MatrixUserManagementService.getAccessToken(environment.adminMatrixAccount.username, environment.adminMatrixAccount.password);
  }


  /* Registration */
  public async createNewUser(username: string, password: string, userDisplayName: string): Promise<any>{
    
    const matrixId: string = "@".concat(username,":studytalk.inform.hs-hannover.de");//Own function later
    const registrationRequestUrl = environment.matrixServerBaseUrl.concat("/_synapse/admin/v2/users/", matrixId);   

    return new Promise(function(resolve, reject){
      MatrixUserManagementService.getAdminAccessToken().then(
        (accessTokens: any) => {

          const auth:string = "Bearer ".concat(accessTokens);
          const registrationRequestData = {
            "displayname": userDisplayName,
            "password": password
          }
          MatrixUserManagementService.putData(registrationRequestUrl, registrationRequestData, auth).then(
            (registerRes: any)=>{
              resolve(registerRes);
            },
            (registerErr: string) => {
              console.log("Error while registering new User " + registerErr);
            }
          )

        },
        (registerTokensErr: string) => {
          console.log("Error while getting Register Tokens " + registerTokensErr);
        }
      )
    });
  }

  /* Reset Password */
  public static changePassword(username: string, newPassword: string): Promise<any> {
    const userId: string = "@".concat(username,":studytalk.inform.hs-hannover.de")

    return new Promise(function(resolve, reject){
      MatrixUserManagementService.getAdminAccessToken().then(
        (adminAccessToken: string) =>{
          const url: string = environment.matrixServerBaseUrl.concat("/_synapse/admin/v1/reset_password/", userId, "?access_token=", adminAccessToken);
          const data = {
            "new_password": newPassword,
            "logout_devices": true
          };
          MatrixUserManagementService.postData(url, data).then(
            (changePwRes: any) =>{
              resolve(changePwRes);
            },
            (changePwErr: string) =>{
              reject("Error while changing password of user "+ username + " : "+ changePwErr)
            },
          )   

        },
        (adminAccessTokenErr: any) =>{
          reject("Failed while getting Admin-Acces-Token: " + adminAccessTokenErr);
        }
      )
    });
  }

  /* Delete User */

  public static deactivateUser(username:string): Promise<any>{
    const userId: string = "@".concat(username,":studytalk.inform.hs-hannover.de")

    return new Promise(function(resolve, reject){
      MatrixUserManagementService.getAdminAccessToken().then(
        (adminAccessToken: string) =>{
          const url: string = environment.matrixServerBaseUrl.concat("/_synapse/admin/v1/deactivate/", userId, "?access_token=", adminAccessToken);
          const data = {
            "erase": true
          };
          MatrixUserManagementService.postData(url, data).then(
            (deactivateRes: any) =>{
              resolve(deactivateRes);
            },
            (deactivateErr: string) =>{
              reject("Error while deactivating user "+ username + " : "+ deactivateErr)
            },
          )   

        },
        (adminAccessTokenErr: any) =>{
          reject("Failed while getting Admin-Acces-Token: " + adminAccessTokenErr);
        }
      )
    });
  }

  /* Get Users */
  public static getUsers(): Promise<string[]>{
    const usersRequestUrl = environment.matrixServerBaseUrl.concat("/_synapse/admin/v2/users");   

    return new Promise(function(resolve, reject){
      MatrixUserManagementService.getAdminAccessToken().then(
        (accessTokens: any) => {
          const auth:string = "Bearer ".concat(accessTokens);
          MatrixUserManagementService.getData(usersRequestUrl, auth).then(
            (registerRes: any)=>{
              const resultList = [];
              for (let index = 0; index < registerRes.users.length; index++) {
                const user = registerRes.users[index];
                resultList.push(user.name);
              }
              resolve(resultList);
            },
            (registerErr: string) => {
              console.log("Error while registering new User " + registerErr);
            }
          )

        },
        (registerTokensErr: string) => {
          console.log("Error while getting Register Tokens " + registerTokensErr);
        }
      )
    });
  }

  /* Fetch-Helpers */
  private static getData(url: string, authorization: string): Promise<any>{
    return new Promise(function(resolve, reject){
      let response = fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authorization
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
  private static postData(url:string, data:any): Promise<any>{

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
        (fetchErr: any) => {
          reject("Error during fetch: " + fetchErr)
        }
      )
    });
  }
  private static putData(url:string, data:any, authorization: string): Promise<any>{

    return new Promise(function(resolve, reject){
      let response = fetch(url, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          "Authorization": authorization
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
        (fetchErr: any) => {
          reject("Error during fetch: " + fetchErr)
        }
      )
    });
  }
}
