import { auditPackage } from '../index.js';

auditPackage(
  `/home/plain/plain/form-builder`,
  `/home/plain/plain/form-builder.md`
).then(() => {
  console.log('本地工程审计完成');
});

// auditPackage(
//   `https://github.com/webpack/webpack-dev-server/tree/v4.9.3`,
//   `/Users/yuanjin/Desktop/webpack-dev-server_4_9_3.md`
// ).then(() => {
//   console.log('远程工程审计完成');
// });
