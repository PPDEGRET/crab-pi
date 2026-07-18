# Remote control

Normal `crab` startup does not load a remote-control extension.

If I explicitly want it:

```powershell
crab remote
```

That loads [`remote-pi`](https://github.com/jacobaraujo7/remote_pi) `0.5.4`, credited in its package metadata to **Jacob Moura**. Its public documentation describes phone control, QR pairing/relay and local agent messaging. I did not create it.

## Why it is opt-in

Remote control changes the trust boundary. A local coding session can become reachable through a relay, mobile client or remote process. That deserves a separate decision rather than a hidden default.

Before I treat it as normal operating infrastructure, I want evidence for:

- one-time pairing and host identity;
- credential storage and revocation;
- relay visibility into prompts and results;
- read/write/command permission behavior;
- reconnect and connection-loss handling;
- audit output without secrets;
- cancellation and cleanup;
- explicit approval before external writes.

## Other meanings of “remote”

There are at least three different designs:

1. **Mobile control:** a remote client observes or controls the local Pi process through `remote-pi`.
2. **Remote tools:** Pi stays local while selected tools operate over SSH.
3. **Remote process control:** a client talks to a Pi process through RPC.

They are not interchangeable and they do not share one security model.

## A safer rollout

1. Use synthetic data and a separate state directory.
2. Start read-only.
3. Keep arbitrary shell and external writes disabled.
4. Test path escape, quoting, timeout, cancellation and reconnect behavior.
5. Check that logs contain no tokens or pairing secrets.
6. Add one write-capable trial only after a human review.

The package is available because I want to explore it, but `crab remote` is not part of the normal startup path and I do not claim that it is production-ready.
