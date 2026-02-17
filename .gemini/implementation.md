Following are the issues need to be fixed one by one :
1) If user has role as head_department then user has access to all the sbu of that department that is present in accessScopes array

for eg. accessScopes has solutions department and its departMentId then all the sbus related to that solutions department has already access for the user
2) on click of export csv button :
api/v1/dashboard/bi-export?cycleId=697094a7eeeba79186851688&export=csv

this api shows access denied 

3) /api/v1/admin/brands?page=1&limit=12

this api should return the brands related to accessScopes array of user
if user has access to sbu then show brands related to that sbu if user has access to department then show brands related to that department

4) api/v1/dashboard/sbu-brands-coverage?cycleId=697094a7eeeba79186851688

this api should return the data related to accessScopes array of user

like if user has access to sbu then show sbu data if user has access to department then show department data lik according to that api should return data

5) /api/v1/admin/clients?page=1&limit=12
for this api user has access to sbu then show clients related to that sbu if user has access to department then show clients related to that department
Like filter te clients based on the accessScopes array of user where Ids are present in accessScopes array

6)api/v1/admin/sbus?page=1&limit=12
This api should return the sbus related to accessScopes array of user
if user has access to sbu then show sbus related to that sbu if user has access to department then show sbus related to that department!
