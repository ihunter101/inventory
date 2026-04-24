import { Router } from "express";
import { randomUUID } from "crypto";
import {
  createSession,
  getSession,
  advanceStage,
  deleteSession,
  setIteratorState,
  resetIteratorState,
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
import {
  getSyncState,
  markFullBackfillComplete,
  updateLastModifiedSyncAt,
  type QuickBooksEntity,
} from "../services/quickbooksSyncState"

const router = Router();

const VALID_USER = process.env.QBWC_USERNAME || "admin";
const VALID_PASS = process.env.QBWC_PASSWORD || "secret123";
const QBWC_APP_URL = process.env.QBWC_APP_URL || "http://localhost:8000";

router.get("/", (_req, res) => {
  const wsdl = `<?xml version="1.0" encoding="UTF-8"?>
<definitions
  name="QBWebConnectorSvc"
  targetNamespace="http://developer.intuit.com/"
  xmlns="http://schemas.xmlsoap.org/wsdl/"
  xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
  xmlns:tns="http://developer.intuit.com/"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema">

  <types>
    <xsd:schema targetNamespace="http://developer.intuit.com/">

      <xsd:complexType name="ArrayOfString">
        <xsd:sequence>
          <xsd:element name="string" type="xsd:string" minOccurs="0" maxOccurs="unbounded"/>
        </xsd:sequence>
      </xsd:complexType>

      <xsd:element name="serverVersion">
        <xsd:complexType/>
      </xsd:element>

      <xsd:element name="serverVersionResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="serverVersionResult" type="xsd:string" minOccurs="0"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <xsd:element name="clientVersion">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="strVersion" type="xsd:string" minOccurs="0"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <xsd:element name="clientVersionResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="clientVersionResult" type="xsd:string" minOccurs="0"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <xsd:element name="authenticate">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="strUserName" type="xsd:string" minOccurs="0"/>
            <xsd:element name="strPassword" type="xsd:string" minOccurs="0"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <xsd:element name="authenticateResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="authenticateResult" type="tns:ArrayOfString" minOccurs="0"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <xsd:element name="sendRequestXML">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="ticket" type="xsd:string" minOccurs="0"/>
            <xsd:element name="strHCPResponse" type="xsd:string" minOccurs="0"/>
            <xsd:element name="strCompanyFileName" type="xsd:string" minOccurs="0"/>
            <xsd:element name="qbXMLCountry" type="xsd:string" minOccurs="0"/>
            <xsd:element name="qbXMLMajorVers" type="xsd:int" minOccurs="0"/>
            <xsd:element name="qbXMLMinorVers" type="xsd:int" minOccurs="0"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <xsd:element name="sendRequestXMLResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="sendRequestXMLResult" type="xsd:string" minOccurs="0"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
      

      <xsd:element name="receiveResponseXML">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="ticket" type="xsd:string" minOccurs="0"/>
            <xsd:element name="response" type="xsd:string" minOccurs="0"/>
            <xsd:element name="hresult" type="xsd:string" minOccurs="0"/>
            <xsd:element name="message" type="xsd:string" minOccurs="0"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <xsd:element name="receiveResponseXMLResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="receiveResponseXMLResult" type="xsd:int"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <xsd:element name="getLastError">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="ticket" type="xsd:string" minOccurs="0"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <xsd:element name="getLastErrorResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="getLastErrorResult" type="xsd:string" minOccurs="0"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <xsd:element name="closeConnection">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="ticket" type="xsd:string" minOccurs="0"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <xsd:element name="closeConnectionResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="closeConnectionResult" type="xsd:string" minOccurs="0"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

    </xsd:schema>
  </types>

  <message name="serverVersionSoapIn">
    <part name="parameters" element="tns:serverVersion"/>
  </message>
  <message name="serverVersionSoapOut">
    <part name="parameters" element="tns:serverVersionResponse"/>
  </message>

  <message name="clientVersionSoapIn">
    <part name="parameters" element="tns:clientVersion"/>
  </message>
  <message name="clientVersionSoapOut">
    <part name="parameters" element="tns:clientVersionResponse"/>
  </message>

  <message name="authenticateSoapIn">
    <part name="parameters" element="tns:authenticate"/>
  </message>
  <message name="authenticateSoapOut">
    <part name="parameters" element="tns:authenticateResponse"/>
  </message>

  <message name="sendRequestXMLSoapIn">
    <part name="parameters" element="tns:sendRequestXML"/>
  </message>
  <message name="sendRequestXMLSoapOut">
    <part name="parameters" element="tns:sendRequestXMLResponse"/>
  </message>

  <message name="receiveResponseXMLSoapIn">
    <part name="parameters" element="tns:receiveResponseXML"/>
  </message>
  <message name="receiveResponseXMLSoapOut">
    <part name="parameters" element="tns:receiveResponseXMLResponse"/>
  </message>

  <message name="getLastErrorSoapIn">
    <part name="parameters" element="tns:getLastError"/>
  </message>
  <message name="getLastErrorSoapOut">
    <part name="parameters" element="tns:getLastErrorResponse"/>
  </message>

  <message name="closeConnectionSoapIn">
    <part name="parameters" element="tns:closeConnection"/>
  </message>
  <message name="closeConnectionSoapOut">
    <part name="parameters" element="tns:closeConnectionResponse"/>
  </message>

  <portType name="QBWebConnectorSvcSoap">
    <operation name="serverVersion">
      <input message="tns:serverVersionSoapIn"/>
      <output message="tns:serverVersionSoapOut"/>
    </operation>
    <operation name="clientVersion">
      <input message="tns:clientVersionSoapIn"/>
      <output message="tns:clientVersionSoapOut"/>
    </operation>
    <operation name="authenticate">
      <input message="tns:authenticateSoapIn"/>
      <output message="tns:authenticateSoapOut"/>
    </operation>
    <operation name="sendRequestXML">
      <input message="tns:sendRequestXMLSoapIn"/>
      <output message="tns:sendRequestXMLSoapOut"/>
    </operation>
    <operation name="receiveResponseXML">
      <input message="tns:receiveResponseXMLSoapIn"/>
      <output message="tns:receiveResponseXMLSoapOut"/>
    </operation>
    <operation name="getLastError">
      <input message="tns:getLastErrorSoapIn"/>
      <output message="tns:getLastErrorSoapOut"/>
    </operation>
    <operation name="closeConnection">
      <input message="tns:closeConnectionSoapIn"/>
      <output message="tns:closeConnectionSoapOut"/>
    </operation>
  </portType>

  <binding name="QBWebConnectorSvcSoap" type="tns:QBWebConnectorSvcSoap">
    <soap:binding transport="http://schemas.xmlsoap.org/soap/http"/>

    <operation name="serverVersion">
      <soap:operation soapAction="http://developer.intuit.com/serverVersion"/>
      <input><soap:body use="literal"/></input>
      <output><soap:body use="literal"/></output>
    </operation>

    <operation name="clientVersion">
      <soap:operation soapAction="http://developer.intuit.com/clientVersion"/>
      <input><soap:body use="literal"/></input>
      <output><soap:body use="literal"/></output>
    </operation>

    <operation name="authenticate">
      <soap:operation soapAction="http://developer.intuit.com/authenticate"/>
      <input><soap:body use="literal"/></input>
      <output><soap:body use="literal"/></output>
    </operation>

    <operation name="sendRequestXML">
      <soap:operation soapAction="http://developer.intuit.com/sendRequestXML"/>
      <input><soap:body use="literal"/></input>
      <output><soap:body use="literal"/></output>
    </operation>

    <operation name="receiveResponseXML">
      <soap:operation soapAction="http://developer.intuit.com/receiveResponseXML"/>
      <input><soap:body use="literal"/></input>
      <output><soap:body use="literal"/></output>
    </operation>

    <operation name="getLastError">
      <soap:operation soapAction="http://developer.intuit.com/getLastError"/>
      <input><soap:body use="literal"/></input>
      <output><soap:body use="literal"/></output>
    </operation>

    <operation name="closeConnection">
      <soap:operation soapAction="http://developer.intuit.com/closeConnection"/>
      <input><soap:body use="literal"/></input>
      <output><soap:body use="literal"/></output>
    </operation>
  </binding>

  <service name="QBWebConnectorSvc">
    <port name="QBWebConnectorSvcSoap" binding="tns:QBWebConnectorSvcSoap">
      <soap:address location="${QBWC_APP_URL}/qbwc"/>
    </port>
  </service>
</definitions>`;

  res.type("text/xml").send(wsdl);
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

      const stage = session.stage as QuickBooksEntity;
      const iterator = session.iterators[stage];
      const syncState = await getSyncState(stage);

      const fromModifiedDate = null;
        syncState.fullBackfillComplete && syncState.lastModifiedSyncAt
          ? syncState.lastModifiedSyncAt.toISOString()
          : null;

      const qbxml =
        iterator.iteratorID && iterator.remainingCount > 0
          ? queries[stage]({
              iterator: "Continue",
              iteratorID: iterator.iteratorID,
              fromModifiedDate,
            })
          : queries[stage]({
              iterator: "Start",
              fromModifiedDate,
            });

            //console.log("QBXML SENT TO QUICKBOOKS:\n", qbxml);
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
      //console.log("SOAP RESPONSE TAG LENGTH:", responseXml.length);
// console.log("SOAP RESPONSE TAG PREVIEW:", responseXml.slice(0, 300));

const hresult = getTagValue(xml, "hresult");
const message = getTagValue(xml, "message");

// console.log("SOAP RESPONSE TAG LENGTH:", responseXml.length);
// console.log("SOAP RESPONSE TAG PREVIEW:", responseXml.slice(0, 300));
// console.log("QB HRESULT:", hresult);
// console.log("QB MESSAGE:", message);
      const session = getSession(ticket);

      if (!session || session.stage === "done") {
        return res.send(
          soapEnvelope(`
<receiveResponseXMLResponse xmlns="http://developer.intuit.com/">
  <receiveResponseXMLResult>-1</receiveResponseXMLResult>
</receiveResponseXMLResponse>`)
        );
      }

      try {
        const decodedResponseXml = xmlUnescape(responseXml);
        //console.log("RAW RESPONSE FROM QUICKBOOKS:\n", decodedResponseXml);
        const parsed = await parseQBResponse(decodedResponseXml);
        //console.log("PARSED QB RESPONSE:\n", parsed);

        if (parsed) {
  await saveQuickBooksData(parsed.type, parsed.data);

  setIteratorState(
    ticket,
    parsed.type,
    parsed.iteratorID,
    parsed.remainingCount
  );

  if (parsed.remainingCount === 0) {
    const syncState = await getSyncState(parsed.type);

    if (!syncState.fullBackfillComplete) {
      await markFullBackfillComplete(parsed.type);
    } else {
      await updateLastModifiedSyncAt(parsed.type);
    }

    resetIteratorState(ticket, parsed.type);
    advanceStage(ticket);
  }

  console.log(
    `Saved QuickBooks ${parsed.type}: ${parsed.data.length} rows, remaining=${parsed.remainingCount}`
  );
}

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