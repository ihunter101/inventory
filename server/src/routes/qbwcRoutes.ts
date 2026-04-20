import { Router } from "express";
import { randomUUID } from "crypto";
import path from "path";
import {
  createSession,
  getSession,
  advanceStage,
  deleteSession,
} from "../quickbooks/qbwcStore";
import { queries } from "../quickbooks/qbxmlRequest";
import { parseQBResponse } from "../quickbooks/qbxmlParser";
import {
  soapEnvelope,
  xmlEscape,
  xmlUnescape,
  getTagValue,
} from "../quickbooks/xmlUtils";
import { saveQuickBooksData } from "../services/quickbooksService";

const router = Router();

const VALID_USER = process.env.QBWC_USERNAME || "admin";
const VALID_PASS = process.env.QBWC_PASSWORD || "secret123";

router.get("/", (_req, res) => {
  res.type("text/xml").sendFile(path.join(process.cwd(), "qbwc.wsdl"));
});

router.post("/", async (req, res) => {
  const xml = req.body || "";
  res.type("text/xml");

  try {
    if (xml.includes("<serverVersion")) {
      return res.send(
        soapEnvelope(`
<serverVersionResponse xmlns="http://developer.intuit.com/">
  <serverVersionResult>1.0.0</serverVersionResult>
</serverVersionResponse>`)
      );
    }

    if (xml.includes("<clientVersion")) {
      return res.send(
        soapEnvelope(`
<clientVersionResponse xmlns="http://developer.intuit.com/">
  <clientVersionResult></clientVersionResult>
</clientVersionResponse>`)
      );
    }

    if (xml.includes("<authenticate")) {
      const strUserName = getTagValue(xml, "strUserName");
      const strPassword = getTagValue(xml, "strPassword");

      if (strUserName !== VALID_USER || strPassword !== VALID_PASS) {
        return res.send(
          soapEnvelope(`
<authenticateResponse xmlns="http://developer.intuit.com/">
  <authenticateResult>
    <string></string>
    <string>nvu</string>
  </authenticateResult>
</authenticateResponse>`)
        );
      }

      const token = randomUUID();
      createSession(token);

      return res.send(
        soapEnvelope(`
<authenticateResponse xmlns="http://developer.intuit.com/">
  <authenticateResult>
    <string>${xmlEscape(token)}</string>
    <string></string>
  </authenticateResult>
</authenticateResponse>`)
      );
    }

    if (xml.includes("<sendRequestXML")) {
      const ticket = getTagValue(xml, "ticket");
      const session = getSession(ticket);

      if (!session || session.stage === "done") {
        return res.send(
          soapEnvelope(`
<sendRequestXMLResponse xmlns="http://developer.intuit.com/">
  <sendRequestXMLResult></sendRequestXMLResult>
</sendRequestXMLResponse>`)
        );
      }

      const qbxml = queries[session.stage]();

      return res.send(
        soapEnvelope(`
<sendRequestXMLResponse xmlns="http://developer.intuit.com/">
  <sendRequestXMLResult>${xmlEscape(qbxml)}</sendRequestXMLResult>
</sendRequestXMLResponse>`)
      );
    }

    if (xml.includes("<receiveResponseXML")) {
      const ticket = getTagValue(xml, "ticket");
      const responseXml = getTagValue(xml, "response");
      const session = getSession(ticket);

      if (!session) {
        return res.send(
          soapEnvelope(`
<receiveResponseXMLResponse xmlns="http://developer.intuit.com/">
  <receiveResponseXMLResult>-1</receiveResponseXMLResult>
</receiveResponseXMLResponse>`)
        );
      }

      try {
        const decodedResponseXml = xmlUnescape(responseXml);
        const parsed = await parseQBResponse(decodedResponseXml);

        if (parsed) {
            session.data[parsed.type] = parsed.data;

            await saveQuickBooksData(parsed.type, parsed.data);

            console.log(`Saved QuickBooks ${parsed.type}: ${parsed.data.length}`);
            }

        advanceStage(ticket);

        const updatedSession = getSession(ticket);
        const percent = updatedSession?.stage === "done" ? 100 : 50;

        return res.send(
          soapEnvelope(`
<receiveResponseXMLResponse xmlns="http://developer.intuit.com/">
  <receiveResponseXMLResult>${percent}</receiveResponseXMLResult>
</receiveResponseXMLResponse>`)
        );
      } catch (error) {
        console.error("Error parsing QuickBooks response:", error);

        return res.send(
          soapEnvelope(`
<receiveResponseXMLResponse xmlns="http://developer.intuit.com/">
  <receiveResponseXMLResult>-1</receiveResponseXMLResult>
</receiveResponseXMLResponse>`)
        );
      }
    }

    if (xml.includes("<getLastError")) {
      return res.send(
        soapEnvelope(`
<getLastErrorResponse xmlns="http://developer.intuit.com/">
  <getLastErrorResult></getLastErrorResult>
</getLastErrorResponse>`)
      );
    }

    if (xml.includes("<closeConnection")) {
      const ticket = getTagValue(xml, "ticket");
      deleteSession(ticket);

      return res.send(
        soapEnvelope(`
<closeConnectionResponse xmlns="http://developer.intuit.com/">
  <closeConnectionResult>OK</closeConnectionResult>
</closeConnectionResponse>`)
      );
    }

    return res.status(500).send(
      soapEnvelope(`
<getLastErrorResponse xmlns="http://developer.intuit.com/">
  <getLastErrorResult>Unknown SOAP action</getLastErrorResult>
</getLastErrorResponse>`)
    );
  } catch (error) {
    console.error(error);

    return res.status(500).send(
      soapEnvelope(`
<getLastErrorResponse xmlns="http://developer.intuit.com/">
  <getLastErrorResult>Server error</getLastErrorResult>
</getLastErrorResponse>`)
    );
  }
});

export default router;