const nodemailer = require('nodemailer');
const redis = require('redis');

const cache = redis.createClient(7001, '192.168.99.100');

const generateCode = () => Math.random()
  .toString(36)
  .slice(-10);

const deleteKeyCache = (email) => {
  cache.del(email, () => {});
};

/*
  Ex JSON:

  {
    "email": "amaury.tavares@ufrpe.br"
  }

*/

const sendEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'blockchaineleicao@gmail.com',
        pass: 'teste@123',
      },
      tls: { rejectUnauthorized: false },
    });

    const randomCode = generateCode();

    cache.set(email, randomCode, 'EX', 300);

    const message = {
      from: 'Eleição Blockchain <blockchaineleicao@gmail.com>',
      to: email,
      subject: 'Código de verificação',
      text: `Código: ${randomCode}`,
      html: `<b>Código: ${randomCode}</b>`,
    };

    await transporter.sendMail(message, (err, info) => {
      if (err) {
        res.status(500).send();
      } else {
        res.send();
      }
    });
  } catch (e) {
    res.status(500).send();
  }
};

/*
  Ex JSON:

  {
    "email": "amaury.tavares@ufrpe.br",
    "domain": "@ufrpe.br"
  }

*/

const validationEmail = async (req, res) => {
  try {
    const { email, domain } = req.body;
    const domainEscaped = domain.replace('.', '\\.');
    const regex = new RegExp(`.+${domainEscaped}$`, 'g');

    res.json({ sucess: regex.test(email) });
  } catch (e) {
    res.status(500).send();
  }
};

/*
  Ex JSON:

  {
    "code": "fvscyl8j1c",
    "email": "amaury.tavares@ufrpe.br"
  }

*/

const validationCode = async (req, res) => {
  try {
    const { code, email } = req.body;

    cache.get(email, (err, codeCached) => {
      // codeCached retorna null quando nao existir valor
      if (codeCached === code) {
        res.json({ sucess: true });
        deleteKeyCache(email);
      } else {
        res.json({ sucess: false });
      }
    });
  } catch (e) {
    res.status(500).send();
  }
};

module.exports = {
  sendEmail,
  validationEmail,
  validationCode,
};
