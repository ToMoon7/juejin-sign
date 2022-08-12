const nodeMailer = require("nodemailer");
const axios = require("axios");

/*---------------配置-----------------*/
const config = {
  baseUrl: "https://api.juejin.cn",
  apiUrl: {
    getTodayStatus: "/growth_api/v1/get_today_status",
    checkIn: "/growth_api/v1/check_in",
    getLotteryConfig: "/growth_api/v1/lottery_config/get",
    drawLottery: "/growth_api/v1/lottery/draw",
  },
  cookie: process.env.COOKIE,
  email: {
    qq: {
      user: process.env.EMAIL,
      from: process.env.EMAIL,
      to: process.env.TO_EMAIL,
      pass: process.env.EMAIL_PASS,
    },
  },
};
console.log("----------");
console.log(config);
console.log(process.env);
console.log("----------");
// 签到
const checkIn = async () => {
  let { error, isCheck } = await getTodayCheckStatus();
  if (error) return "查询签到失败";
  if (isCheck) return "今日已参与签到";
  const { cookie, baseUrl, apiUrl } = config;
  let { data } = await axios({
    url: baseUrl + apiUrl.checkIn,
    method: "post",
    headers: { Cookie: cookie },
  });
  if (data.err_no) {
    return "今日掘金签到：失败" + JSON.stringify(data);
  } else {
    return `今日掘金签到：成功，本次签到${data.data.incr_point}, 余额：${data.data.sum_point}`;
  }
};

// 查询今日是否已经签到
const getTodayCheckStatus = async () => {
  const { cookie, baseUrl, apiUrl } = config;
  let { data } = await axios({
    url: baseUrl + apiUrl.getTodayStatus,
    method: "get",
    headers: { Cookie: cookie },
  });

  return { error: data.err_no !== 0, isCheck: data.data };
};

// 抽奖
const draw = async () => {
  let { error, isDraw } = await getTodayDrawStatus();
  if (error) return "查询抽奖次数失败";
  if (isDraw) return "今日已无免费抽奖次数";
  const { cookie, baseUrl, apiUrl } = config;
  let { data } = await axios({
    url: baseUrl + apiUrl.drawLottery,
    method: "post",
    headers: { Cookie: cookie },
  });
  if (data.err_no) return "免费抽奖失败";
  return `恭喜抽到：${data.data.lottery_name}`;
};

// 获取今天免费抽奖的次数
const getTodayDrawStatus = async () => {
  const { cookie, baseUrl, apiUrl } = config;
  let { data } = await axios({
    url: baseUrl + apiUrl.getLotteryConfig,
    method: "get",
    headers: { Cookie: cookie },
  });
  if (data.err_no) {
    return { error: true, isDraw: false };
  } else {
    return { error: false, isDraw: data.data.free_count === 0 };
  }
};

/*---------------邮件-----------------*/

// 通过qq邮箱发送
const sendEmail = async (subject, html) => {
  let cfg = config.email.qq;
  if (!cfg || !cfg.user || !cfg.pass) return;
  const transporter = nodeMailer.createTransport({
    host: "smtp.qiye.aliyun.com",
    port: 25,
    secureConnection: true,
    auth: { user: cfg.user, pass: cfg.pass },
  });
  transporter.sendMail(
    {
      from: cfg.from,
      to: cfg.to,
      subject: subject,
      html: html,
    },
    (err) => {
      if (err) return console.log(`发送邮件失败：${err}`, true);
    }
  );
};
(async () => {
  try {
    let checkRes = await checkIn();
    let drawRes = await draw();
    await sendEmail("掘金签到", checkRes + "<br>" + drawRes);
    console.log("签到成功", checkRes, drawRes);
  } catch (error) {
    await sendEmail("今日掘金签到：失败", error);
    console.log("签到失败", error);
  }
})();
