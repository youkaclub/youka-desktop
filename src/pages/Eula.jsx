import React, { useState } from "react";
import { Button } from "semantic-ui-react";
import { useHistory } from "react-router-dom";
import store from "../lib/store";

const remote = require("electron").remote;

export default function EulaPage() {
  let history = useHistory();
  const [stats, setStats] = useState(true);

  function handleAccept() {
    store.set("eula", true);
    store.set("stats", stats);
    history.push("/");
  }

  function handleDecline() {
    const window = remote.getCurrentWindow();
    window.close();
  }

  function handleChangeStats() {
    setStats(!stats);
  }

  return (
    <div className="flex flex-col items-center m-4">
      <div className="font-bold text-2xl p-4">License Agreement</div>
      <div className="font-bold p-4">
        You must accept the license agreement before continuing
      </div>
      <div
        className="overflow-scroll overflow-x-auto p-6"
        style={{ maxWidth: "90vh", maxHeight: "50vh" }}
      >
        <h2>
          End-User License Agreement (EULA) of{" "}
          <span className="font-bold">Youka</span>
        </h2>

        <p>
          This End-User License Agreement ("EULA") is a legal agreement between
          you and <span className="font-bold">Youka</span>
        </p>

        <p>
          This EULA agreement governs your acquisition and use of our{" "}
          <span className="font-bold">Youka</span> software ("Software")
          directly from <span className="font-bold">Youka</span> or indirectly
          through a <span className="font-bold">Youka</span> authorized reseller
          or distributor (a "Reseller").
        </p>

        <p>
          Please read this EULA agreement carefully before completing the
          installation process and using the{" "}
          <span className="font-bold">Youka</span> software. It provides a
          license to use the <span className="font-bold">Youka</span> software
          and contains warranty information and liability disclaimers.
        </p>

        <p>
          If you register for a free trial of the{" "}
          <span className="font-bold">Youka</span> software, this EULA agreement
          will also govern that trial. By clicking "accept" or installing and/or
          using the <span className="font-bold">Youka</span> software, you are
          confirming your acceptance of the Software and agreeing to become
          bound by the terms of this EULA agreement.
        </p>

        <p>
          If you are entering into this EULA agreement on behalf of a company or
          other legal entity, you represent that you have the authority to bind
          such entity and its affiliates to these terms and conditions. If you
          do not have such authority or if you do not agree with the terms and
          conditions of this EULA agreement, do not install or use the Software,
          and you must not accept this EULA agreement.
        </p>

        <p>
          This EULA agreement shall apply only to the Software supplied by{" "}
          <span className="font-bold">Youka</span> herewith regardless of
          whether other software is referred to or described herein. The terms
          also apply to any <span className="font-bold">Youka</span> updates,
          supplements, Internet-based services, and support services for the
          Software, unless other terms accompany those items on delivery. If so,
          those terms apply. This EULA was created by{" "}
          <a href="https://www.eulatemplate.com">EULA Template</a> for{" "}
          <span className="font-bold">Youka</span>.
        </p>

        <h3>License Grant</h3>

        <p>
          <span className="font-bold">Youka</span> hereby grants you a personal,
          non-transferable, non-exclusive licence to use the{" "}
          <span className="font-bold">Youka</span> software on your devices in
          accordance with the terms of this EULA agreement.
        </p>

        <p>
          You are permitted to load the <span className="font-bold">Youka</span>{" "}
          software (for example a PC, laptop, mobile or tablet) under your
          control. You are responsible for ensuring your device meets the
          minimum requirements of the <span className="font-bold">Youka</span>{" "}
          software.
        </p>

        <p>You are not permitted to:</p>

        <ul>
          <li>
            Edit, alter, modify, adapt, translate or otherwise change the whole
            or any part of the Software nor permit the whole or any part of the
            Software to be combined with or become incorporated in any other
            software, nor decompile, disassemble or reverse engineer the
            Software or attempt to do any such things
          </li>
          <li>
            Reproduce, copy, distribute, resell or otherwise use the Software
            for any commercial purpose
          </li>
          <li>
            Allow any third party to use the Software on behalf of or for the
            benefit of any third party
          </li>
          <li>
            Use the Software in any way which breaches any applicable local,
            national or international law
          </li>
          <li>
            use the Software for any purpose that{" "}
            <span className="font-bold">Youka</span> considers is a breach of
            this EULA agreement
          </li>
        </ul>

        <h3>Intellectual Property and Ownership</h3>

        <p>
          <span className="font-bold">Youka</span> shall at all times retain
          ownership of the Software as originally downloaded by you and all
          subsequent downloads of the Software by you. The Software (and the
          copyright, and other intellectual property rights of whatever nature
          in the Software, including any modifications made thereto) are and
          shall remain the property of <span className="font-bold">Youka</span>.
        </p>

        <p>
          <span className="font-bold">Youka</span> reserves the right to grant
          licences to use the Software to third parties.
        </p>

        <h3>Termination</h3>

        <p>
          This EULA agreement is effective from the date you first use the
          Software and shall continue until terminated. You may terminate it at
          any time upon written notice to{" "}
          <span className="font-bold">Youka</span>.
        </p>

        <p>
          It will also terminate immediately if you fail to comply with any term
          of this EULA agreement. Upon such termination, the licenses granted by
          this EULA agreement will immediately terminate and you agree to stop
          all access and use of the Software. The provisions that by their
          nature continue and survive will survive any termination of this EULA
          agreement.
        </p>

        <h3>Governing Law</h3>

        <p>
          This EULA agreement, and any dispute arising out of or in connection
          with this EULA agreement, shall be governed by and construed in
          accordance with the laws of <span className="country">us</span>.
        </p>
      </div>
      <form className="m-4">
        <label>
          <input
            className="mx-2"
            type="checkbox"
            name="stats"
            checked={stats}
            onChange={handleChangeStats}
          />
          Help make Youka better by sending anonymous usage statistics and crash
          reports to the Youka project.
        </label>
      </form>
      <div className="flex flex-row m-4">
        <Button className="m-2" content="Decline" onClick={handleDecline} />
        <Button
          className="m-2"
          content="Accept"
          primary
          onClick={handleAccept}
        />
      </div>
    </div>
  );
}
